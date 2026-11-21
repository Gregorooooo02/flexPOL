package com.flexpol.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Secret match input. Never include in a public DTO, event or log. */
public record DuelMarketSpec(int schemaVersion, String valuationVersion, LocalDate startDate,
		int durationDays, BigDecimal baseAmount, long seed, List<FrozenSimulationDefinition> instruments) {

	public static final String VALUATION_VERSION = "duel-relative-v1";
	public static final BigDecimal BASE_AMOUNT = new BigDecimal("1000000.00");

	public DuelMarketSpec {
		instruments = List.copyOf(instruments);
	}
}
