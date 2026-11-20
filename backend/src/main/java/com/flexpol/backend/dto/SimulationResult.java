package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.flexpol.backend.model.SimulationAssumptions;
import com.flexpol.backend.model.SimulationPoint;

/**
 * One unsaved trajectory, including its initial investment at startDate and the
 * actual random seed used. Monetary values use currency; totalReturn is a
 * fraction (0.10 means 10%) equal to finalValue / initialInvestment - 1.
 */
public record SimulationResult(
		Long instrumentId,
		String currency,
		BigDecimal initialInvestment,
		Integer durationMonths,
		LocalDate startDate,
		LocalDate endDate,
		long randomSeed,
		SimulationAssumptions assumptions,
		BigDecimal finalValue,
		BigDecimal totalReturn,
		List<SimulationPoint> points) {
}
