package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.flexpol.backend.entity.DuelOutcome;

/** Released only after evaluation, to participants. No seeds, claims or engine parameters. */
public record DuelResultResponse(int schemaVersion, UUID matchId, Instant completedAt, String evaluationVersion, String valuationVersion,
		String currency, BigDecimal budget, LocalDate startDate, LocalDate endDate, List<LocalDate> dates,
		DuelOutcome outcome, Long winnerId, BigDecimal finalValueGap, BigDecimal returnDifferencePercentagePoints,
		List<PlayerResult> players) {
	public DuelResultResponse {
		dates = List.copyOf(dates);
		players = List.copyOf(players);
	}

	/** Returns/drawdown are fractions; the comparison gap above is in percentage points. */
	public record PlayerResult(Long userId, String username, int seat, BigDecimal cash, BigDecimal invested,
			List<InstrumentResult> instruments, List<BigDecimal> values, BigDecimal finalValue,
			BigDecimal profit, BigDecimal totalReturn, BigDecimal maxDrawdown) {
		public PlayerResult {
			instruments = List.copyOf(instruments);
			values = List.copyOf(values);
		}
	}

	public record InstrumentResult(Long instrumentId, String name, BigDecimal allocation,
			List<BigDecimal> values, BigDecimal finalValue, BigDecimal contribution) {
		public InstrumentResult {
			values = List.copyOf(values);
		}
	}
}
