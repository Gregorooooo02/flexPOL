package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.flexpol.backend.entity.DuelCancellationReason;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.entity.DuelSubmissionSource;
import com.flexpol.backend.entity.DuelFailureReason;

/** Recipient-specific snapshot. Opponent allocations and emails are never serialized here. */
public record DuelMatchResponse(
		UUID id,
		DuelPhase phase,
		long revision,
		DuelScenarioResponse scenario,
		Instant createdAt,
		Instant planningStartsAt,
		Instant planningEndsAt,
		Instant evaluationStartedAt,
		Instant cancelledAt,
		DuelCancellationReason cancellationReason,
		Instant evaluatedAt,
		Instant failedAt,
		DuelFailureReason failureReason,
		Instant serverNow,
		List<Player> players,
		Portfolio ownPortfolio) {

	public DuelMatchResponse {
		players = List.copyOf(players);
	}

	public record Player(Long userId, String username, int seat, boolean submitted) {
	}

	public record Portfolio(long revision, List<Allocation> allocations, BigDecimal invested, BigDecimal cash,
			Instant savedAt, Instant submittedAt, DuelSubmissionSource submissionSource) {
		public Portfolio {
			allocations = List.copyOf(allocations);
		}
	}

	public record Allocation(Long instrumentId, BigDecimal amount) {
	}
}
