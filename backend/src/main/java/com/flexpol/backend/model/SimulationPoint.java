package com.flexpol.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;

/** A simulated investment amount in the result's currency, not an index level. */
public record SimulationPoint(
		LocalDate date,
		BigDecimal investmentValue) {
}
