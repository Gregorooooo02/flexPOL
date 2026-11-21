package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.flexpol.backend.entity.DuelOutcome;

/** Historical balances, not current balances: re-reading a completed game never recalculates rank. */
public record DuelSettlementResponse(int schemaVersion, UUID matchId, Instant settledAt, String formulaVersion,
		DuelOutcome outcome, Long winnerId, BigDecimal budget, BigDecimal finalValueGap, int rawTransfer,
		int appliedTransfer, boolean loserFloorApplied, List<PlayerChange> players) {
	public DuelSettlementResponse {
		players = List.copyOf(players);
	}

	public record PlayerChange(Long userId, String username, int seat, long pointsBefore, long delta, long pointsAfter) {
	}
}
