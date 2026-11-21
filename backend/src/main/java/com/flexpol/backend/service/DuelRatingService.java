package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Objects;
import java.util.stream.Collectors;

import com.flexpol.backend.dto.DuelRatingResponse;
import com.flexpol.backend.dto.DuelResultResponse;
import com.flexpol.backend.dto.DuelSettlementResponse;
import com.flexpol.backend.entity.DuelMatch;
import com.flexpol.backend.entity.DuelOutcome;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.entity.DuelRating;
import com.flexpol.backend.entity.DuelRatingChange;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.DuelRatingChangeRepository;
import com.flexpol.backend.repository.DuelRatingRepository;
import com.flexpol.backend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/** Transparent zero-sum Duel points, not Elo or a score of investment competence. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DuelRatingService {

	public static final String FORMULA_VERSION = "duel-gap-v1";
	private static final long STARTING_POINTS = 1000;
	private final DuelRatingRepository ratings;
	private final DuelRatingChangeRepository changes;
	private final UserRepository users;

	/** Lazy creation also covers seeded learners. User locking serializes first-account creation. */
	@Transactional
	public DuelRatingResponse getRating(Long userId) {
		if (userId == null) throw new ResourceNotFoundException("User", null);
		var user = users.findLockedById(userId).orElseThrow(() -> new ResourceNotFoundException("User", userId));
		var account = ratings.findById(userId).orElseGet(() -> {
			var created = new DuelRating();
			created.setUser(user);
			created.setUserId(userId);
			created.setPoints(STARTING_POINTS);
			return ratings.saveAndFlush(created);
		});
		return new DuelRatingResponse(userId, account.getPoints());
	}

	/** Caller holds the match write lock. Existing accounts are locked by ascending user ID, never user rows. */
	@Transactional(propagation = Propagation.MANDATORY)
	public void settleLocked(DuelMatch match, DuelResultResponse result, Instant now) {
		if (match.getPhase() == DuelPhase.FINISHED) return;
		if (match.getPhase() != DuelPhase.REPLAY || now.isBefore(match.getReplayEndsAt())
				|| !FORMULA_VERSION.equals(match.getRatingFormulaVersion())) {
			throw new IllegalStateException("Duel cannot be settled in its current state or formula version");
		}
		var playerIds = match.getParticipants().stream().map(player -> player.getUser().getId()).collect(Collectors.toSet());
		var resultIds = result.players().stream().map(DuelResultResponse.PlayerResult::userId).collect(Collectors.toSet());
		if (!match.getId().equals(result.matchId()) || playerIds.size() != 2 || result.players().size() != 2
				|| !playerIds.equals(resultIds) || result.budget().signum() <= 0) {
			throw new IllegalStateException("Duel result does not match the participants/budget");
		}
		var a = result.players().getFirst();
		var b = result.players().getLast();
		int comparison = a.finalValue().compareTo(b.finalValue());
		Long winner = comparison == 0 ? null : comparison > 0 ? a.userId() : b.userId();
		var gap = a.finalValue().subtract(b.finalValue()).abs();
		if (!Objects.equals(winner, result.winnerId()) || gap.compareTo(result.finalValueGap()) != 0
				|| result.outcome() != (winner == null ? DuelOutcome.DRAW : DuelOutcome.WIN)) {
			throw new IllegalStateException("Duel result has an inconsistent outcome");
		}
		var accounts = new HashMap<Long, DuelRating>();
		for (var userId : playerIds.stream().sorted().toList()) {
			var account = ratings.findLockedByUserId(userId)
					.orElseThrow(() -> new IllegalStateException("Duel participant has no ranking account"));
			if (account.getPoints() < 0) throw new IllegalStateException("Duel points must not be negative");
			accounts.put(userId, account);
		}
		int raw = rawTransfer(gap, result.budget());
		Long loser = winner == null ? null : playerIds.stream().filter(id -> !id.equals(winner)).findFirst().orElseThrow();
		int applied = loser == null ? 0 : (int) Math.min(raw, accounts.get(loser).getPoints());
		var ledger = new ArrayList<DuelRatingChange>();
		for (var player : result.players().stream().sorted(Comparator.comparingInt(DuelResultResponse.PlayerResult::seat)).toList()) {
			var account = accounts.get(player.userId());
			long delta = winner == null ? 0 : player.userId().equals(winner) ? applied : -applied;
			var entry = new DuelRatingChange();
			entry.setMatch(match);
			entry.setRating(account);
			entry.setUsername(player.username());
			entry.setSeat(player.seat());
			entry.setPointsBefore(account.getPoints());
			entry.setDelta(delta);
			entry.setPointsAfter(Math.addExact(account.getPoints(), delta));
			account.setPoints(entry.getPointsAfter());
			ledger.add(entry);
		}
		changes.saveAllAndFlush(ledger);
		match.setRawRatingTransfer(raw);
		match.setAppliedRatingTransfer(applied);
		match.setFinishedAt(now);
		match.setPhase(DuelPhase.FINISHED);
		match.setRevision(match.getRevision() + 1);
	}

	/** Caller has authorized the recipient and locked the FINISHED match. No balances are recomputed. */
	@Transactional(propagation = Propagation.MANDATORY, readOnly = true)
	public DuelSettlementResponse readSettlementLocked(DuelMatch match, DuelResultResponse result) {
		var ledger = changes.findByMatchIdOrderBySeatAsc(match.getId());
		if (match.getPhase() != DuelPhase.FINISHED || ledger.size() != 2 || match.getRawRatingTransfer() == null
				|| match.getAppliedRatingTransfer() == null || match.getFinishedAt() == null) {
			throw new IllegalStateException("Finished Duel has no complete settlement");
		}
		var players = ledger.stream().map(entry -> new DuelSettlementResponse.PlayerChange(entry.getRating().getUserId(),
				entry.getUsername(), entry.getSeat(), entry.getPointsBefore(), entry.getDelta(), entry.getPointsAfter())).toList();
		return new DuelSettlementResponse(1, match.getId(), match.getFinishedAt(), match.getRatingFormulaVersion(), result.outcome(),
				result.winnerId(), result.budget(), result.finalValueGap(), match.getRawRatingTransfer(), match.getAppliedRatingTransfer(),
				match.getAppliedRatingTransfer() < match.getRawRatingTransfer(), players);
	}

	/** Exact rational rounding: no intermediate gap-share rounding near a half-point boundary. */
	static int rawTransfer(BigDecimal gap, BigDecimal budget) {
		if (gap.signum() < 0 || budget.signum() <= 0) throw new IllegalArgumentException("Invalid Duel gap/budget");
		if (gap.signum() == 0) return 0;
		return 10 + gap.multiply(BigDecimal.valueOf(300)).divide(budget, 0, RoundingMode.HALF_UP)
				.min(BigDecimal.valueOf(30)).intValueExact();
	}
}
