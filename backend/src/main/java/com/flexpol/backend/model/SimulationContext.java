package com.flexpol.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** Engine inputs independent of HTTP requests and managed persistence entities. */
public record SimulationContext(
		BigDecimal initialInvestment,
		LocalDate startDate,
		LocalDate endDate,
		long randomSeed,
		Map<String, Object> parameters) {

	public SimulationContext {
		parameters = Collections.unmodifiableMap(new LinkedHashMap<>(parameters));
	}
}
