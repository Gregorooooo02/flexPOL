package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.flexpol.backend.dto.DuelMatchResponse;
import com.flexpol.backend.dto.DuelPortfolioRequest;
import com.flexpol.backend.dto.DuelSettlementResponse;
import com.flexpol.backend.dto.LoginRequest;
import com.flexpol.backend.dto.UserResponse;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.DuelConflictException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.exception.UnauthorizedException;
import com.flexpol.backend.repository.DuelMatchRepository;
import com.flexpol.backend.repository.DuelRatingChangeRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest(properties = {
		"hedgeflex.duel.coordinator-enabled=false",
		"spring.datasource.url=jdbc:h2:mem:duel-lifecycle-tests;NON_KEYWORDS=USER"
})
@Import(DuelMatchServiceTests.TimeConfiguration.class)
class DuelApiServiceTests {

	@Autowired private DuelApiService api;
	@Autowired private DuelMatchService matches;
	@Autowired private UserService users;
	@Autowired private DuelEvaluationWorker worker;
	@Autowired private DuelMatchRepository matchRepository;
	@Autowired private DuelRatingChangeRepository changes;
	@Autowired private DuelMatchServiceTests.MutableClock clock;

	@BeforeEach
	void resetTime() {
		clock.set(Instant.parse("2026-11-21T12:00:00Z"));
	}

	@Test
	void requiresKnownIdentityAndInitializesOneProfileWithoutLeakingOtherMatches() {
		assertThatThrownBy(() -> api.getMe(null)).isInstanceOf(UnauthorizedException.class);
		assertThatThrownBy(() -> api.getMe("unknown@duel.test")).isInstanceOf(UnauthorizedException.class);
		assertThatThrownBy(() -> api.getMatch(UUID.randomUUID(), null)).isInstanceOf(UnauthorizedException.class);
		var first = learner();
		var second = learner();
		var outsider = learner();
		var profile = api.getMe(outsider.email());
		assertThat(profile.rating().userId()).isEqualTo(outsider.id());
		assertThat(profile.rating().points()).isEqualTo(1000);
		assertThat(profile.activeMatchId()).isNull();
		assertThat(profile.latestTerminalMatchId()).isNull();
		assertThat(api.getMe("  " + outsider.email().toUpperCase(java.util.Locale.ROOT) + "  ")).isEqualTo(profile);
		var id = matches.createMatch(first.id(), second.id());
		assertThat(api.getMe(outsider.email())).isEqualTo(profile);
		assertThatThrownBy(() -> api.getMatch(id, outsider.email())).isInstanceOf(ResourceNotFoundException.class);
		assertThatThrownBy(() -> api.saveDraft(id, new DuelPortfolioRequest(0L, List.of()), outsider.email()))
				.isInstanceOf(ResourceNotFoundException.class);
		assertThatThrownBy(() -> api.getSettlement(id, outsider.email())).isInstanceOf(ResourceNotFoundException.class);
	}

	@Test
	void recoveryReferencesTrackOnlyOwnActiveAndLatestTerminalMatchesAndExposeSettledPoints() {
		var first = learner();
		var second = learner();
		var third = learner();
		var cancelled = api.getMatch(matches.createMatch(first.id(), second.id()), first.email());
		assertThat(api.getMe(first.email()).activeMatchId()).isEqualTo(cancelled.id());
		clock.set(cancelled.planningEndsAt());
		// /me returns references only; it must not reconcile after taking the profile's user-row lock.
		assertThat(api.getMe(first.email()).activeMatchId()).isEqualTo(cancelled.id());
		assertThat(api.getMatch(cancelled.id(), first.email()).phase()).isEqualTo(DuelPhase.CANCELLED);
		var next = api.getMatch(matches.createMatch(first.id(), third.id()), first.email());
		var profile = api.getMe(first.email());
		assertThat(profile.activeMatchId()).isEqualTo(next.id());
		assertThat(profile.latestTerminalMatchId()).isEqualTo(cancelled.id());
		assertThat(api.getMe(second.email()).activeMatchId()).isNull();
		assertThat(api.getMe(second.email()).latestTerminalMatchId()).isEqualTo(cancelled.id());
		clock.set(next.planningStartsAt());
		api.submit(next.id(), plan(next, 0, "100"), first.email());
		api.submit(next.id(), plan(next, 0, "200"), third.email());
		worker.evaluateMatch(next.id());
		var evaluated = api.getMatch(next.id(), first.email());
		clock.set(evaluated.replayEndsAt());
		var settlement = api.getSettlement(next.id(), first.email());
		var finishedProfile = api.getMe(first.email());
		assertThat(finishedProfile.activeMatchId()).isNull();
		assertThat(finishedProfile.latestTerminalMatchId()).isEqualTo(next.id());
		assertThat(finishedProfile.rating().points()).isEqualTo(settlement.players().stream()
				.filter(player -> player.userId().equals(first.id())).findFirst().orElseThrow().pointsAfter());
		assertThat(api.getMe(second.email()).latestTerminalMatchId()).isEqualTo(cancelled.id());
	}

	@Test
	void portfolioOperationsActAsTheHeaderLearnerAndPreserveConflictAndReleaseContracts() {
		var first = learner();
		var second = learner();
		var brief = api.getMatch(matches.createMatch(first.id(), second.id()), first.email());
		clock.set(brief.planningStartsAt());
		var saved = api.saveDraft(brief.id(), plan(brief, 0, "100"), first.email());
		assertThat(saved.ownPortfolio().invested()).isEqualByComparingTo("100");
		assertThat(api.getMatch(brief.id(), second.email()).ownPortfolio().invested()).isZero();
		assertThatThrownBy(() -> api.saveDraft(brief.id(), plan(brief, 0, "999"), first.email()))
				.isInstanceOfSatisfying(DuelConflictException.class, error -> {
					assertThat(error.getSnapshot().ownPortfolio().revision()).isEqualTo(1);
					assertThat(error.getSnapshot().ownPortfolio().invested()).isEqualByComparingTo("100");
				});
		assertThatThrownBy(() -> api.submit(brief.id(), new DuelPortfolioRequest(0L, List.of()), second.email()))
				.isInstanceOf(BadRequestException.class);
		assertThatThrownBy(() -> api.getResult(brief.id(), first.email())).isInstanceOf(DuelConflictException.class);
		api.submit(brief.id(), plan(brief, 1, "150"), first.email());
		api.submit(brief.id(), plan(brief, 0, "200"), second.email());
		worker.evaluateMatch(brief.id());
		var result = api.getResult(brief.id(), first.email());
		assertThat(result).isEqualTo(api.getResult(brief.id(), second.email()));
		assertThat(result.players()).extracting(player -> player.invested()).containsExactly(new BigDecimal("150.00"), new BigDecimal("200.00"));
		var evaluated = api.getMatch(brief.id(), first.email());
		clock.set(evaluated.replayEndsAt());
		DuelSettlementResponse settlement = api.getSettlement(brief.id(), second.email());
		assertThat(api.getSettlement(brief.id(), first.email())).isEqualTo(settlement);
		assertThat(api.submit(brief.id(), plan(brief, 0, "999"), first.email()).ownPortfolio().invested()).isEqualByComparingTo("150");
	}

	@Test
	void outerApiTransactionDoesNotRollBackTimeoutOrSettlementWhenALateSaveConflicts() {
		var first = learner();
		var second = learner();
		var brief = api.getMatch(matches.createMatch(first.id(), second.id()), first.email());
		clock.set(brief.planningStartsAt());
		api.saveDraft(brief.id(), plan(brief, 0, "100"), first.email());
		api.saveDraft(brief.id(), plan(brief, 0, "100"), second.email());
		clock.set(brief.planningEndsAt());
		assertThatThrownBy(() -> api.saveDraft(brief.id(), plan(brief, 1, "999"), first.email()))
				.isInstanceOf(DuelConflictException.class);
		// Inspect persisted state, not another reconciling read that could hide a rolled-back timeout.
		assertThat(matchRepository.findById(brief.id()).orElseThrow().getPhase()).isEqualTo(DuelPhase.EVALUATING);
		worker.evaluateMatch(brief.id());
		var evaluated = api.getMatch(brief.id(), first.email());
		clock.set(evaluated.replayEndsAt());
		assertThatThrownBy(() -> api.saveDraft(brief.id(), plan(brief, 1, "999"), first.email()))
				.isInstanceOfSatisfying(DuelConflictException.class,
						error -> assertThat(error.getSnapshot().phase()).isEqualTo(DuelPhase.FINISHED));
		assertThat(matchRepository.findById(brief.id()).orElseThrow().getPhase()).isEqualTo(DuelPhase.FINISHED);
		assertThat(changes.findByMatchIdOrderBySeatAsc(brief.id())).hasSize(2);
		assertThat(api.getMatch(brief.id(), first.email()).ownPortfolio().invested()).isEqualByComparingTo("100");
	}

	private UserResponse learner() {
		return users.login(new LoginRequest("Duel learner", UUID.randomUUID() + "@duel.test"));
	}

	private static DuelPortfolioRequest plan(DuelMatchResponse match, long revision, String amount) {
		return new DuelPortfolioRequest(revision, List.of(new DuelPortfolioRequest.Allocation(
				match.scenario().instruments().getFirst().id(), new BigDecimal(amount))));
	}
}
