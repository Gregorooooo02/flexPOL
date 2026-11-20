package com.flexpol.backend.model;

import java.util.List;
import java.util.Map;

/**
 * The model and assumptions actually used by the engine. Rates are fractions,
 * not percentage points. Limitations must distinguish explicit fee calculations
 * from fund expenses already reflected in historical source values.
 */
public record SimulationAssumptions(
		String modelKey,
		String modelVersion,
		Map<String, Object> parameters,
		boolean includesTaxes,
		boolean includesInflation,
		boolean includesFees,
		String distributionTreatment,
		List<String> limitations) {
}
