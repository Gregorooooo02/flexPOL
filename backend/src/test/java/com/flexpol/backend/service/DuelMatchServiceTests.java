package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import com.flexpol.backend.dto.DuelMatchResponse;
import com.flexpol.backend.dto.DuelPortfolioRequest;
import com.flexpol.backend.dto.LoginRequest;
import com.flexpol.backend.entity.DuelCancellationReason;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.entity.DuelSubmissionSource;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.DuelConflictException;
import com.flexpol.backend.exception.ResourceNotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;

import tools.jackson.databind.json.JsonMapper;

/** Service-boundary tests: real transactions, a controllable clock, no HTTP or real-time sleeps. */
@SpringBootTest(properties = {
		"hedgeflex.duel.coordinator-enabled=false",
		"spring.datasource.url=jdbc:h2:mem:duel-lifecycle-tests;NON_KEYWORDS=USER"
})
@Import(DuelMatchServiceTests.TimeConfiguration.class)
class DuelMatchServiceTests {

	@Autowired
	private DuelMatchService matches;
	@Autowired
	private UserService users;
	@Autowired
	private MutableClock clock;
	@Autowired
	private JsonMapper jsonMapper;

	@BeforeEach
	void resetTime() {
		clock.set(Instant.parse("2026-11-21T12:00:00Z"));
	}

	@Test
	void createsOneSharedBriefAndRejectsSelfUnknownAndDuplicateActiveParticipation() {
		var first = learner();
		var second = learner();
		var id = matches.createMatch(first, second);
		var a = matches.getMatch(id, first);
		var b = matches.getMatch(id, second);

		assertThat(a.phase()).isEqualTo(DuelPhase.BRIEFING);
		assertThat(a.scenario()).isEqualTo(b.scenario());
		assertThat(a.revision()).isEqualTo(1);
		assertThat(Duration.between(a.createdAt(), a.planningStartsAt())).isEqualTo(Duration.ofSeconds(8));
		assertThat(Duration.between(a.planningStartsAt(), a.planningEndsAt())).isEqualTo(Duration.ofSeconds(120));
		assertThat(a.ownPortfolio().cash()).isEqualByComparingTo(a.scenario().budget());
		assertThat(a.players()).extracting(DuelMatchResponse.Player::userId).containsExactly(first, second);
		assertThatThrownBy(() -> matches.saveDraft(id, first, plan(a, 0, "100")))
				.isInstanceOf(DuelConflictException.class);
		assertThatThrownBy(() -> matches.createMatch(first, first)).isInstanceOf(BadRequestException.class);
		assertThatThrownBy(() -> matches.createMatch(first, Long.MAX_VALUE)).isInstanceOf(ResourceNotFoundException.class);
		assertThatThrownBy(() -> matches.createMatch(second, first)).isInstanceOf(DuelConflictException.class);
		assertThat(matches.getMatch(id, second).scenario()).isEqualTo(a.scenario());
	}

	@Test
	void savesReplacesAndRemovesDraftPositionsAndRejectsStaleOrInvalidPlans() {
		var first = learner();
		var a = planning(first, learner());
		var saved = matches.saveDraft(a.id(), first, plan(a, 0, "100.50"));
		assertThat(saved.ownPortfolio().revision()).isEqualTo(1);
		assertThat(saved.ownPortfolio().cash()).isEqualByComparingTo(a.scenario().budget().subtract(new BigDecimal("100.50")));
		matches.saveDraft(a.id(), first, plan(a, 1, "200"));
		matches.saveDraft(a.id(), first, new DuelPortfolioRequest(2L, List.of()));
		var replaced = matches.saveDraft(a.id(), first, plan(a, 3, "300"));
		assertThat(matches.getMatch(a.id(), first).ownPortfolio()).isEqualTo(replaced.ownPortfolio());
		assertThatThrownBy(() -> matches.saveDraft(a.id(), first, plan(a, 1, "400")))
				.isInstanceOfSatisfying(DuelConflictException.class, error -> {
					assertThat(error.getSnapshot().ownPortfolio().revision()).isEqualTo(4);
					assertThat(error.getSnapshot().ownPortfolio().invested()).isEqualByComparingTo("300");
				});
		var instrument = a.scenario().instruments().getFirst().id();
		var otherInstrument = a.scenario().instruments().get(1).id();
		for (var request : List.of(
				new DuelPortfolioRequest(4L, List.of(allocation(Long.MAX_VALUE, "1"))),
				new DuelPortfolioRequest(4L, List.of(allocation(instrument, "0.001"))),
				new DuelPortfolioRequest(4L, List.of(allocation(instrument, "-1"))),
				new DuelPortfolioRequest(4L, List.of(allocation(instrument, "1"), allocation(instrument, "2"))),
				new DuelPortfolioRequest(4L, List.of(new DuelPortfolioRequest.Allocation(instrument, a.scenario().budget()), allocation(otherInstrument, "0.01"))))) {
			assertThatThrownBy(() -> matches.saveDraft(a.id(), first, request)).isInstanceOf(BadRequestException.class);
		}
		assertThat(matches.getMatch(a.id(), first).ownPortfolio()).isEqualTo(replaced.ownPortfolio());
	}

	@Test
	void manualSubmissionAtomicallySavesLocksAndStartsEvaluationWhenBothAreReady() {
		var first = learner();
		var second = learner();
		var a = planning(first, second);
		assertThatThrownBy(() -> matches.submit(a.id(), first, new DuelPortfolioRequest(0L, List.of())))
				.isInstanceOf(BadRequestException.class);
		matches.saveDraft(a.id(), first, plan(a, 0, "100"));
		var submitted = matches.submit(a.id(), first, plan(a, 1, "200"));
		assertThat(submitted.phase()).isEqualTo(DuelPhase.PLANNING);
		assertThat(submitted.ownPortfolio().invested()).isEqualByComparingTo("200");
		assertThat(submitted.ownPortfolio().submissionSource()).isEqualTo(DuelSubmissionSource.MANUAL);
		assertThat(submitted.ownPortfolio().submittedAt()).isEqualTo(clock.instant());
		assertThatThrownBy(() -> matches.saveDraft(a.id(), first, plan(a, 2, "300")))
				.isInstanceOf(DuelConflictException.class);
		assertThat(matches.submit(a.id(), first, plan(a, 0, "999")).ownPortfolio()).isEqualTo(submitted.ownPortfolio());
		var finishedPlanning = matches.submit(a.id(), second, plan(a, 0, "100"));
		assertThat(finishedPlanning.phase()).isEqualTo(DuelPhase.EVALUATING);
		assertThat(finishedPlanning.evaluationStartedAt()).isEqualTo(clock.instant());
		assertThat(finishedPlanning.players()).allMatch(DuelMatchResponse.Player::submitted);
		matches.advanceDueMatch(a.id());
		var repeated = matches.submit(a.id(), second, plan(a, 99, "999"));
		assertThat(repeated).isEqualTo(finishedPlanning);
	}

	@Test
	void exactDeadlineLocksAcknowledgedDraftsAndConflictDoesNotRollBackTimeout() {
		var first = learner();
		var second = learner();
		var a = planning(first, second);
		matches.saveDraft(a.id(), first, plan(a, 0, "100"));
		matches.saveDraft(a.id(), second, plan(a, 0, "200"));
		clock.set(a.planningEndsAt().minusNanos(1));
		assertThat(matches.getMatch(a.id(), first).phase()).isEqualTo(DuelPhase.PLANNING);
		clock.set(a.planningEndsAt());
		assertThat(matches.findDueMatchIds()).contains(a.id());
		assertThatThrownBy(() -> matches.saveDraft(a.id(), first, plan(a, 1, "999")))
				.isInstanceOfSatisfying(DuelConflictException.class,
						error -> assertThat(error.getSnapshot().phase()).isEqualTo(DuelPhase.EVALUATING));
		var timedOut = matches.getMatch(a.id(), first);
		assertThat(timedOut.phase()).isEqualTo(DuelPhase.EVALUATING);
		assertThat(timedOut.ownPortfolio().revision()).isEqualTo(1);
		assertThat(timedOut.ownPortfolio().invested()).isEqualByComparingTo("100");
		assertThat(timedOut.ownPortfolio().submittedAt()).isEqualTo(a.planningEndsAt());
		assertThat(timedOut.ownPortfolio().submissionSource()).isEqualTo(DuelSubmissionSource.TIMEOUT);
		assertThat(matches.getMatch(a.id(), second).ownPortfolio().invested()).isEqualByComparingTo("200");
		assertThat(matches.findDueMatchIds()).doesNotContain(a.id());
	}

	@Test
	void schedulerCancelsAnEmptyPortfolioAndReleasesBothLearnersForAnotherMatch() {
		var first = learner();
		var second = learner();
		var a = planning(first, second);
		matches.submit(a.id(), first, plan(a, 0, "100"));
		clock.set(a.planningEndsAt().plusSeconds(15));
		matches.advanceDueMatch(a.id());
		var cancelled = matches.getMatch(a.id(), second);
		assertThat(cancelled.phase()).isEqualTo(DuelPhase.CANCELLED);
		assertThat(cancelled.cancellationReason()).isEqualTo(DuelCancellationReason.EMPTY_PORTFOLIO);
		assertThat(cancelled.evaluationStartedAt()).isNull();
		assertThat(cancelled.ownPortfolio().revision()).isZero();
		assertThat(cancelled.ownPortfolio().savedAt()).isNull();
		assertThat(cancelled.ownPortfolio().submissionSource()).isEqualTo(DuelSubmissionSource.TIMEOUT);
		assertThat(cancelled.ownPortfolio().submittedAt()).isEqualTo(a.planningEndsAt());
		assertThat(matches.getMatch(a.id(), first).ownPortfolio().submissionSource()).isEqualTo(DuelSubmissionSource.MANUAL);
		matches.advanceDueMatch(a.id());
		assertThat(matches.getMatch(a.id(), second)).isEqualTo(cancelled);
		assertThat(matches.createMatch(first, second)).isNotEqualTo(a.id());
	}

	@Test
	void snapshotsExposeOnlyOwnPortfolioAndOtherLearnersCannotReadOrWrite() {
		var first = learner();
		var second = learner();
		var outsider = learner();
		var a = planning(first, second);
		matches.saveDraft(a.id(), first, plan(a, 0, "123.45"));
		matches.saveDraft(a.id(), second, plan(a, 0, "987.65"));
		var response = matches.getMatch(a.id(), first);
		assertThat(response.ownPortfolio().invested()).isEqualByComparingTo("123.45");
		var json = jsonMapper.writeValueAsString(response);
		assertThat(json).doesNotContain("987.65", "email", "opponentPortfolio", "randomSeed", "scenarioJson", "persistenceVersion");
		for (var player : jsonMapper.readTree(json).get("players")) {
			assertThat(player.has("allocations") || player.has("cash") || player.has("savedAt")).isFalse();
		}
		assertThatThrownBy(() -> matches.getMatch(a.id(), outsider)).isInstanceOf(ResourceNotFoundException.class);
		assertThatThrownBy(() -> matches.getMatch(UUID.randomUUID(), first)).isInstanceOf(ResourceNotFoundException.class);
		assertThatThrownBy(() -> matches.saveDraft(a.id(), outsider, plan(a, 0, "100"))).isInstanceOf(ResourceNotFoundException.class);
		assertThatThrownBy(() -> matches.submit(a.id(), outsider, plan(a, 0, "100"))).isInstanceOf(ResourceNotFoundException.class);
	}

	@Test
	void overlappingCreationsAndDeadlineCommandsAreSerialized() throws Exception {
		var first = learner();
		var second = learner();
		var third = learner();
		List<UUID> creations = race(List.of(
				() -> tryCreate(first, second),
				() -> tryCreate(third, first)));
		assertThat(creations.stream().filter(id -> id != null).toList()).hasSize(1);
		var id = creations.stream().filter(value -> value != null).findFirst().orElseThrow();
		var brief = matches.getMatch(id, first);
		var opponent = brief.players().stream().map(DuelMatchResponse.Player::userId).filter(user -> !user.equals(first)).findFirst().orElseThrow();
		clock.set(brief.planningStartsAt());
		matches.saveDraft(id, first, plan(brief, 0, "100"));
		matches.saveDraft(id, opponent, plan(brief, 0, "200"));
		clock.set(brief.planningEndsAt());
		List<Boolean> outcomes = race(List.of(
				() -> { matches.advanceDueMatch(id); return true; },
				() -> {
					try {
						matches.saveDraft(id, first, plan(brief, 1, "999"));
						return false;
					} catch (DuelConflictException expected) {
						return true;
					}
				},
				() -> { matches.submit(id, opponent, plan(brief, 1, "999")); return true; }
		));
		outcomes.forEach(accepted -> assertThat(accepted).isTrue());
		var frozen = matches.getMatch(id, first);
		assertThat(frozen.phase()).isEqualTo(DuelPhase.EVALUATING);
		assertThat(frozen.ownPortfolio().invested()).isEqualByComparingTo("100");
		assertThat(matches.getMatch(id, opponent).ownPortfolio().invested()).isEqualByComparingTo("200");
		matches.advanceDueMatch(id);
		assertThat(matches.getMatch(id, first).revision()).isEqualTo(frozen.revision());
	}

	private UUID tryCreate(Long first, Long second) {
		try {
			return matches.createMatch(first, second);
		} catch (DuelConflictException expected) {
			return null;
		}
	}

	private static <T> List<T> race(List<Callable<T>> commands) throws Exception {
		var gate = new CyclicBarrier(commands.size());
		try (var pool = Executors.newFixedThreadPool(commands.size())) {
			var futures = commands.stream().map(command -> pool.submit(() -> {
				gate.await(5, TimeUnit.SECONDS);
				return command.call();
			})).toList();
			var results = new ArrayList<T>();
			for (var future : futures) {
				results.add(future.get(10, TimeUnit.SECONDS));
			}
			return results;
		}
	}

	private Long learner() {
		return users.login(new LoginRequest("Duel learner", UUID.randomUUID() + "@duel.test")).id();
	}

	private DuelMatchResponse planning(Long first, Long second) {
		var brief = matches.getMatch(matches.createMatch(first, second), first);
		clock.set(brief.planningStartsAt());
		return matches.getMatch(brief.id(), first);
	}

	private static DuelPortfolioRequest plan(DuelMatchResponse match, long revision, String amount) {
		return new DuelPortfolioRequest(revision, List.of(allocation(match.scenario().instruments().getFirst().id(), amount)));
	}

	private static DuelPortfolioRequest.Allocation allocation(Long instrument, String amount) {
		return new DuelPortfolioRequest.Allocation(instrument, new BigDecimal(amount));
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class TimeConfiguration {
		@Bean
		@Primary
		MutableClock testDuelClock() {
			return new MutableClock(new AtomicReference<>(Instant.parse("2026-11-21T12:00:00Z")), ZoneOffset.UTC);
		}
	}

	static final class MutableClock extends Clock {
		private final AtomicReference<Instant> now;
		private final ZoneId zone;

		MutableClock(AtomicReference<Instant> now, ZoneId zone) {
			this.now = now;
			this.zone = zone;
		}

		void set(Instant instant) {
			now.set(instant);
		}

		@Override
		public ZoneId getZone() {
			return zone;
		}

		@Override
		public Clock withZone(ZoneId zone) {
			return new MutableClock(now, zone);
		}

		@Override
		public Instant instant() {
			return now.get();
		}
	}
}
