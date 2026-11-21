package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import com.flexpol.backend.dto.DuelMatchResponse;
import com.flexpol.backend.dto.DuelPortfolioRequest;
import com.flexpol.backend.dto.DuelSettlementResponse;
import com.flexpol.backend.dto.LoginRequest;
import com.flexpol.backend.entity.DuelOutcome;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.exception.DuelConflictException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.model.DuelMarketSpec;
import com.flexpol.backend.model.FrozenSimulationDefinition;
import com.flexpol.backend.repository.DuelMatchRepository;
import com.flexpol.backend.repository.DuelRatingChangeRepository;
import com.flexpol.backend.repository.DuelRatingRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(properties = {
		"hedgeflex.duel.coordinator-enabled=false",
		"spring.datasource.url=jdbc:h2:mem:duel-lifecycle-tests;NON_KEYWORDS=USER"
})
@Import(DuelMatchServiceTests.TimeConfiguration.class)
class DuelRatingServiceTests {

	@Autowired private DuelMatchService matches;
	@Autowired private DuelRatingService ratings;
	@Autowired private DuelEvaluationWorker worker;
	@Autowired private UserService users;
	@Autowired private DuelMatchRepository matchRepository;
	@Autowired private DuelRatingRepository ratingRepository;
	@Autowired private DuelRatingChangeRepository changes;
	@Autowired private DuelMatchServiceTests.MutableClock clock;
	@Autowired private JsonMapper jsonMapper;

	@BeforeEach
	void resetTime() {
		clock.set(Instant.parse("2026-11-21T12:00:00Z"));
	}

	@Test
	void formulaNormalizesBudgetsCapsTheTransferAndRoundsHalfUpWithoutIntermediateRounding() {
		assertThat(transfer("500", "10000")).isEqualTo(25);
		assertThat(transfer("1000", "20000")).isEqualTo(25);
		assertThat(transfer("50000", "10000")).isEqualTo(40);
		assertThat(transfer("0", "10000")).isZero();
		assertThat(transfer("0.01", "10000")).isEqualTo(10);
		assertThat(transfer("49.99", "30000")).isEqualTo(10);
		assertThat(transfer("50", "30000")).isEqualTo(11);
	}

	@Test
	void replayUsesFixedServerDeadlinesAndAnExactDeadlineDrawSettlesWithoutChangingBalances() {
		var first = learner();
		var second = learner();
		assertThat(ratings.getRating(first).points()).isEqualTo(1000);
		assertThat(ratings.getRating(first).points()).isEqualTo(1000);
		assertThat(ratings.getRating(1L).points()).isEqualTo(1000); // seeded learners have the same default
		var evaluated = evaluated(first, second, "100", "100");
		var result = matches.getResult(evaluated.id(), first);
		assertThat(Duration.between(clock.instant(), evaluated.replayStartsAt())).isEqualTo(Duration.ofSeconds(2));
		assertThat(Duration.between(evaluated.replayStartsAt(), evaluated.replayEndsAt())).isEqualTo(Duration.ofSeconds(10));
		clock.set(evaluated.replayStartsAt().minusNanos(1));
		assertThat(matches.getMatch(evaluated.id(), second).phase()).isEqualTo(DuelPhase.EVALUATED);
		assertThatThrownBy(() -> matches.getSettlement(evaluated.id(), first)).isInstanceOf(DuelConflictException.class);
		clock.set(evaluated.replayStartsAt());
		assertThat(matches.findDueMatchIds()).contains(evaluated.id());
		var playing = matches.getMatch(evaluated.id(), first);
		assertThat(playing.phase()).isEqualTo(DuelPhase.REPLAY);
		assertThat(playing.replayStartsAt()).isEqualTo(evaluated.replayStartsAt());
		assertThat(playing.replayEndsAt()).isEqualTo(evaluated.replayEndsAt());
		assertThat(matches.getResult(evaluated.id(), second)).isEqualTo(result);
		assertThatThrownBy(() -> matches.createMatch(first, second)).isInstanceOf(DuelConflictException.class);
		clock.set(evaluated.replayEndsAt().minusNanos(1));
		assertThat(matches.getMatch(evaluated.id(), first).phase()).isEqualTo(DuelPhase.REPLAY);
		assertThat(changes.findByMatchIdOrderBySeatAsc(evaluated.id())).isEmpty();
		clock.set(evaluated.replayEndsAt());
		matches.advanceDueMatch(evaluated.id()); // coordinator path, without a browser finishing playback
		var finished = matches.getMatch(evaluated.id(), first);
		assertThat(finished.phase()).isEqualTo(DuelPhase.FINISHED);
		assertThat(finished.finishedAt()).isEqualTo(evaluated.replayEndsAt());
		var settlement = matches.getSettlement(evaluated.id(), first);
		assertThat(settlement.outcome()).isEqualTo(DuelOutcome.DRAW);
		assertThat(settlement.rawTransfer()).isZero();
		assertThat(settlement.appliedTransfer()).isZero();
		assertThat(settlement.loserFloorApplied()).isFalse();
		assertThat(settlement.players()).allSatisfy(player -> {
			assertThat(player.delta()).isZero();
			assertThat(player.pointsBefore()).isEqualTo(1000);
			assertThat(player.pointsAfter()).isEqualTo(1000);
		});
		assertThat(matches.getSettlement(evaluated.id(), second)).isEqualTo(settlement);
		assertThat(matches.getResult(evaluated.id(), first)).isEqualTo(result);
		assertThat(matches.findDueMatchIds()).doesNotContain(evaluated.id());
		assertThatThrownBy(() -> matches.getSettlement(evaluated.id(), learner())).isInstanceOf(ResourceNotFoundException.class);
		assertThat(matches.createMatch(first, second)).isNotEqualTo(evaluated.id());
	}

	@Test
	void lateCatchUpAppliesTheLoserFloorAndKeepsHistoricalBalancesStableAcrossLaterGames() {
		var first = learner();
		var second = learner();
		var evaluated = evaluated(first, second, "100", "200");
		setPoints(first, 8);
		clock.set(evaluated.replayEndsAt().plusSeconds(30)); // skip the entire replay, without rescheduling it
		var settlement = matches.getSettlement(evaluated.id(), first);
		assertThat(settlement.winnerId()).isEqualTo(second);
		assertThat(settlement.rawTransfer()).isBetween(10, 40);
		assertThat(settlement.appliedTransfer()).isEqualTo(8);
		assertThat(settlement.loserFloorApplied()).isTrue();
		assertThat(settlement.players()).extracting(DuelSettlementResponse.PlayerChange::delta).containsExactly(-8L, 8L);
		assertThat(ratings.getRating(first).points()).isZero();
		assertThat(ratings.getRating(second).points()).isEqualTo(1008);
		assertThat(matches.getMatch(evaluated.id(), first).replayEndsAt()).isEqualTo(evaluated.replayEndsAt());

		var next = evaluated(first, second, "100", "200");
		clock.set(next.replayEndsAt());
		var zeroFloor = matches.getSettlement(next.id(), second);
		assertThat(zeroFloor.rawTransfer()).isPositive();
		assertThat(zeroFloor.appliedTransfer()).isZero();
		assertThat(zeroFloor.loserFloorApplied()).isTrue();
		assertThat(ratings.getRating(second).points()).isEqualTo(1008);
		assertThat(matches.getSettlement(evaluated.id(), second)).isEqualTo(settlement);
	}

	@Test
	void concurrentDeadlineReadsAndCoordinatorRunsTransferPointsExactlyOnce() throws Exception {
		var first = learner();
		var second = learner();
		var evaluated = evaluated(first, second, "100", "200");
		clock.set(evaluated.replayEndsAt());
		var gate = new CyclicBarrier(3);
		List<Callable<Boolean>> commands = List.of(
				() -> matches.getMatch(evaluated.id(), first).phase() == DuelPhase.FINISHED,
				() -> { matches.advanceDueMatch(evaluated.id()); return true; },
				() -> matches.getSettlement(evaluated.id(), second).winnerId().equals(second));
		try (var pool = Executors.newFixedThreadPool(3)) {
			var futures = commands.stream().map(command -> pool.submit(() -> {
				gate.await(5, TimeUnit.SECONDS);
				return command.call();
			})).toList();
			for (var future : futures) assertThat(future.get(10, TimeUnit.SECONDS)).isTrue();
		}
		var settlement = matches.getSettlement(evaluated.id(), first);
		assertThat(settlement.appliedTransfer()).isEqualTo(settlement.rawTransfer()).isBetween(10, 40);
		assertThat(ratings.getRating(first).points()).isEqualTo(1000 - settlement.appliedTransfer());
		assertThat(ratings.getRating(second).points()).isEqualTo(1000 + settlement.appliedTransfer());
		assertThat(changes.findByMatchIdOrderBySeatAsc(evaluated.id())).hasSize(2);
		assertThat(matches.getMatch(evaluated.id(), first).revision()).isEqualTo(evaluated.revision() + 2);
		matches.advanceDueMatch(evaluated.id());
		worker.evaluateMatch(evaluated.id());
		assertThat(matches.getSettlement(evaluated.id(), first)).isEqualTo(settlement);
	}

	@Test
	void settlementFailureRollsBackBothBalancesAuditAndTheFinishedTransition() {
		var first = learner();
		var second = learner();
		var evaluated = evaluated(first, second, "100", "200");
		setPoints(second, Long.MAX_VALUE);
		clock.set(evaluated.replayEndsAt());
		assertThatThrownBy(() -> matches.advanceDueMatch(evaluated.id())).isInstanceOf(ArithmeticException.class);
		assertThat(ratings.getRating(first).points()).isEqualTo(1000); // earlier in the debit/credit loop
		assertThat(ratings.getRating(second).points()).isEqualTo(Long.MAX_VALUE);
		assertThat(changes.findByMatchIdOrderBySeatAsc(evaluated.id())).isEmpty();
		var unchanged = matchRepository.findById(evaluated.id()).orElseThrow();
		assertThat(unchanged.getPhase()).isEqualTo(DuelPhase.EVALUATED);
		assertThat(unchanged.getFinishedAt()).isNull();
		assertThat(unchanged.getRawRatingTransfer()).isNull();
	}

	@Test
	void cancelledAndFailedMatchesNeverCreateRankingTransfers() {
		var first = learner();
		var second = learner();
		var brief = matches.getMatch(matches.createMatch(first, second), first);
		clock.set(brief.planningEndsAt());
		matches.advanceDueMatch(brief.id());
		assertThat(matches.getMatch(brief.id(), first).phase()).isEqualTo(DuelPhase.CANCELLED);
		assertThatThrownBy(() -> matches.getSettlement(brief.id(), first)).isInstanceOf(DuelConflictException.class);
		assertThat(changes.findByMatchIdOrderBySeatAsc(brief.id())).isEmpty();

		var next = submitted(first, second, "100", "200");
		var broken = matchRepository.findById(next.id()).orElseThrow();
		broken.setMarketJson(broken.getMarketJson().replace("gbm-v1", "unavailable"));
		matchRepository.saveAndFlush(broken);
		worker.evaluateMatch(next.id());
		assertThat(matches.getMatch(next.id(), second).phase()).isEqualTo(DuelPhase.FAILED);
		assertThatThrownBy(() -> matches.getSettlement(next.id(), second)).isInstanceOf(DuelConflictException.class);
		assertThat(changes.findByMatchIdOrderBySeatAsc(next.id())).isEmpty();
		assertThat(ratings.getRating(first).points()).isEqualTo(1000);
		assertThat(ratings.getRating(second).points()).isEqualTo(1000);
	}

	private DuelMatchResponse evaluated(Long first, Long second, String firstAmount, String secondAmount) {
		var ready = submitted(first, second, firstAmount, secondAmount);
		worker.evaluateMatch(ready.id());
		return matches.getMatch(ready.id(), first);
	}

	private DuelMatchResponse submitted(Long first, Long second, String firstAmount, String secondAmount) {
		var brief = matches.getMatch(matches.createMatch(first, second), first);
		var entity = matchRepository.findById(brief.id()).orElseThrow();
		var market = jsonMapper.readValue(entity.getMarketJson(), DuelMarketSpec.class);
		// A deterministic positive-return fixture, without changing any live catalogue configuration.
		var definitions = market.instruments().stream().map(definition -> new FrozenSimulationDefinition(definition.instrumentId(),
				definition.currency(), definition.modelKey(), definition.modelVersion(), Map.of("annualExpectedReturn", new BigDecimal("0.1"),
						"annualVolatility", BigDecimal.ZERO, "periodsPerYear", 252))).toList();
		entity.setMarketJson(jsonMapper.writeValueAsString(new DuelMarketSpec(market.schemaVersion(), market.valuationVersion(), market.startDate(),
				market.durationDays(), market.baseAmount(), market.seed(), definitions)));
		matchRepository.saveAndFlush(entity);
		clock.set(brief.planningStartsAt());
		var instrument = brief.scenario().instruments().getFirst().id();
		matches.submit(brief.id(), first, new DuelPortfolioRequest(0L,
				List.of(new DuelPortfolioRequest.Allocation(instrument, new BigDecimal(firstAmount)))));
		return matches.submit(brief.id(), second, new DuelPortfolioRequest(0L,
				List.of(new DuelPortfolioRequest.Allocation(instrument, new BigDecimal(secondAmount)))));
	}

	private void setPoints(Long userId, long points) {
		var account = ratingRepository.findById(userId).orElseThrow();
		account.setPoints(points);
		ratingRepository.saveAndFlush(account);
	}

	private Long learner() {
		return users.login(new LoginRequest("Duel learner", UUID.randomUUID() + "@duel.test")).id();
	}

	private static int transfer(String gap, String budget) {
		return DuelRatingService.rawTransfer(new BigDecimal(gap), new BigDecimal(budget));
	}
}
