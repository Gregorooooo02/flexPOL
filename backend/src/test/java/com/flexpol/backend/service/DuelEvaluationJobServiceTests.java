package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import com.flexpol.backend.config.DuelProperties;
import com.flexpol.backend.dto.DuelMatchResponse;
import com.flexpol.backend.dto.DuelPortfolioRequest;
import com.flexpol.backend.dto.LoginRequest;
import com.flexpol.backend.entity.DuelFailureReason;
import com.flexpol.backend.entity.DuelOutcome;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.exception.DuelConflictException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.model.DuelEvaluationWork;
import com.flexpol.backend.repository.DuelMatchRepository;
import com.flexpol.backend.repository.DuelResultRepository;
import com.flexpol.backend.repository.SimulationConfigurationRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import tools.jackson.databind.json.JsonMapper;

/** Exercises transactional job boundaries and detached computation, not HTTP or scheduler timing. */
@SpringBootTest(properties = {
		"hedgeflex.duel.coordinator-enabled=false",
		"spring.datasource.url=jdbc:h2:mem:duel-lifecycle-tests;NON_KEYWORDS=USER"
})
@Import(DuelMatchServiceTests.TimeConfiguration.class)
class DuelEvaluationJobServiceTests {

	@Autowired private DuelMatchService matches;
	@Autowired private UserService users;
	@Autowired private DuelEvaluationJobService jobs;
	@Autowired private DuelEvaluationService evaluator;
	@Autowired private DuelEvaluationWorker worker;
	@Autowired private DuelMatchRepository matchRepository;
	@Autowired private DuelResultRepository results;
	@Autowired private SimulationConfigurationRepository configurations;
	@Autowired private DuelMatchServiceTests.MutableClock clock;
	@Autowired private DuelProperties properties;
	@Autowired private JsonMapper jsonMapper;

	@BeforeEach
	void resetTime() {
		clock.set(Instant.parse("2026-11-21T12:00:00Z"));
	}

	@Test
	void frozenMarketSurvivesCatalogueChangesAndStoredResultsArePrivateAndIdempotent() {
		var first = learner();
		var second = learner();
		var ready = ready(first, second);
		var work = jobs.claim(ready.id()).orElseThrow();
		assertThat(work.market().startDate()).isEqualTo(LocalDate.ofInstant(ready.createdAt(), ZoneOffset.UTC));
		assertThat(work.market().instruments()).hasSize(ready.scenario().instruments().size());
		assertThat(jobs.claim(ready.id())).isEmpty();
		var expected = evaluator.evaluate(work);
		var configuration = configurations.findByInstrumentId(ready.scenario().instruments().getFirst().id()).orElseThrow();
		var original = configuration.getParametersJson();
		try {
			configuration.setParametersJson("{}");
			configurations.saveAndFlush(configuration);
			assertThat(evaluator.evaluate(work)).isEqualTo(expected); // never rereads the now-broken catalogue
			assertThat(jobs.complete(work, expected)).isTrue();
		} finally {
			configuration.setParametersJson(original);
			configurations.saveAndFlush(configuration);
		}
		assertThat(expected.outcome()).isEqualTo(DuelOutcome.DRAW);
		var stored = matches.getResult(ready.id(), first);
		assertThat(stored).isEqualTo(expected).isEqualTo(matches.getResult(ready.id(), second));
		assertThat(matches.getMatch(ready.id(), first).phase()).isEqualTo(DuelPhase.EVALUATED);
		assertThat(matches.getMatch(ready.id(), first).ownPortfolio().allocations()).hasSize(1);
		assertThatThrownBy(() -> matches.createMatch(first, second)).isInstanceOf(DuelConflictException.class);
		assertThatThrownBy(() -> matches.getResult(ready.id(), learner())).isInstanceOf(ResourceNotFoundException.class);
		assertThat(jsonMapper.writeValueAsString(stored)).doesNotContain("seed", "parameters", "marketJson", "modelVersion", "claimToken");
		var revision = matches.getMatch(ready.id(), first).revision();
		worker.evaluateMatch(ready.id());
		assertThat(jobs.complete(work, expected)).isFalse();
		assertThat(matches.getMatch(ready.id(), first).revision()).isEqualTo(revision);
		assertThat(matches.getResult(ready.id(), first)).isEqualTo(stored);
	}

	@Test
	void competingClaimsAndExpiredWorkersCannotOverwriteResultsAndRetriesAreBounded() throws Exception {
		var first = learner();
		var ready = ready(first, learner());
		var gate = new CyclicBarrier(2);
		List<Optional<DuelEvaluationWork>> claims;
		try (var pool = Executors.newFixedThreadPool(2)) {
			var a = pool.submit(() -> { gate.await(5, TimeUnit.SECONDS); return jobs.claim(ready.id()); });
			var b = pool.submit(() -> { gate.await(5, TimeUnit.SECONDS); return jobs.claim(ready.id()); });
			claims = List.of(a.get(10, TimeUnit.SECONDS), b.get(10, TimeUnit.SECONDS));
		}
		assertThat(claims.stream().filter(Optional::isPresent).toList()).hasSize(1);
		var old = claims.stream().flatMap(Optional::stream).findFirst().orElseThrow();
		var oldResult = evaluator.evaluate(old);
		clock.set(clock.instant().plus(properties.evaluationLease()));
		assertThat(jobs.complete(old, oldResult)).isFalse(); // expired even before replacement worker claims it
		var replacement = jobs.claim(ready.id()).orElseThrow();
		assertThat(replacement.claimToken()).isNotEqualTo(old.claimToken());
		assertThat(replacement.market()).isEqualTo(old.market());
		assertThat(jobs.fail(old)).isFalse();
		assertThat(jobs.complete(old, oldResult)).isFalse();
		assertThat(jobs.complete(replacement, evaluator.evaluate(replacement))).isTrue();
		assertThat(matches.getResult(ready.id(), first).players()).isEqualTo(oldResult.players());

		var timeoutUser = learner();
		var timeout = ready(timeoutUser, learner());
		for (int attempt = 0; attempt < properties.evaluationMaxAttempts(); attempt++) {
			assertThat(jobs.claim(timeout.id())).isPresent();
			clock.set(clock.instant().plus(properties.evaluationLease()));
		}
		assertThat(jobs.claim(timeout.id())).isEmpty();
		assertThat(matches.getMatch(timeout.id(), timeoutUser).failureReason()).isEqualTo(DuelFailureReason.EVALUATION_TIMEOUT);
		assertThat(results.existsById(timeout.id())).isFalse();
		assertThat(jobs.findPendingIds()).doesNotContain(timeout.id());
	}

	@Test
	void workerFailsAnUnavailableFrozenEngineWithoutRerollAndReleasesThePlayers() {
		var first = learner();
		var second = learner();
		var ready = ready(first, second);
		var entity = matchRepository.findById(ready.id()).orElseThrow();
		var brokenMarket = entity.getMarketJson().replace("gbm-v1", "unavailable-version");
		assertThat(brokenMarket).isNotEqualTo(entity.getMarketJson());
		entity.setMarketJson(brokenMarket);
		matchRepository.saveAndFlush(entity);
		worker.evaluateMatch(ready.id());
		var failed = matches.getMatch(ready.id(), first);
		assertThat(failed.phase()).isEqualTo(DuelPhase.FAILED);
		assertThat(failed.failureReason()).isEqualTo(DuelFailureReason.EVALUATION_ERROR);
		assertThat(failed.failedAt()).isEqualTo(clock.instant());
		assertThat(results.existsById(ready.id())).isFalse();
		assertThatThrownBy(() -> matches.getResult(ready.id(), second)).isInstanceOf(DuelConflictException.class);
		worker.evaluateMatch(ready.id());
		assertThat(matches.getMatch(ready.id(), first)).isEqualTo(failed);
		assertThat(matchRepository.findById(ready.id()).orElseThrow().getMarketJson()).isEqualTo(brokenMarket);
		assertThat(jsonMapper.writeValueAsString(failed)).doesNotContain("unavailable-version", "parameters", "seed", "marketJson");
		var next = ready(first, second);
		assertThat(next.id()).isNotEqualTo(ready.id());
		worker.evaluateMatch(next.id());
		assertThat(matches.getMatch(next.id(), first).phase()).isEqualTo(DuelPhase.EVALUATED);
		assertThat(matches.getResult(next.id(), second).outcome()).isEqualTo(DuelOutcome.DRAW);
	}

	private DuelMatchResponse ready(Long first, Long second) {
		var brief = matches.getMatch(matches.createMatch(first, second), first);
		assertThatThrownBy(() -> matches.getResult(brief.id(), first)).isInstanceOf(DuelConflictException.class);
		clock.set(brief.planningStartsAt());
		var allocation = new DuelPortfolioRequest(0L, List.of(new DuelPortfolioRequest.Allocation(
				brief.scenario().instruments().getFirst().id(), new java.math.BigDecimal("100.00"))));
		matches.submit(brief.id(), first, allocation);
		return matches.submit(brief.id(), second, allocation);
	}

	private Long learner() {
		return users.login(new LoginRequest("Duel learner", UUID.randomUUID() + "@duel.test")).id();
	}
}
