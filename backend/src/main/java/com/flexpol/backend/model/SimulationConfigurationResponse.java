package com.flexpol.backend.model;

import java.util.Map;

/** Model-specific parameters and provenance as structured JSON, not a JSON string. */
public record SimulationConfigurationResponse(
		String modelKey,
		Map<String, Object> parameters) {
}
