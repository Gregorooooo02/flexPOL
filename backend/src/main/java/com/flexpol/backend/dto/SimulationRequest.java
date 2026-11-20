package com.flexpol.backend.dto;

import java.math.BigDecimal;

/**
 * A single initial investment over a duration in months. Currency comes from the
 * instrument. A null randomSeed requests a generated seed; zero is a valid seed.
 */
public record SimulationRequest(
		Long instrumentId,
		BigDecimal initialInvestment,
		Integer durationMonths,
		Long randomSeed) {
}
