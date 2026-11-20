package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One historical value: date is the rebased display date, originalDate is the
 * source session date. The instrument's historyValueType determines value units;
 * a normalized index level is not a monetary amount.
 */
public record HistoricalObservationResponse(
		LocalDate date,
		LocalDate originalDate,
		BigDecimal value) {
}
