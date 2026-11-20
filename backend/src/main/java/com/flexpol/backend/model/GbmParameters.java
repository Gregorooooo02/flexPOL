package com.flexpol.backend.model;

import java.math.BigDecimal;

/** Annual model drift and volatility as fractions, not percentages or CAGR. */
public record GbmParameters(
		BigDecimal annualExpectedReturn,
		BigDecimal annualVolatility,
		int periodsPerYear) {
}
