package com.flexpol.backend.model;

import java.math.BigDecimal;

/** Nominal annual rate with ACT/365 fractional accrual and an explicit maturity policy. */
public record FixedRateParameters(
		BigDecimal annualNominalRate,
		int compoundsPerYear,
		int termMonths,
		String maturityPolicy) {
}
