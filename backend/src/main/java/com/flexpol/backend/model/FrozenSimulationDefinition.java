package com.flexpol.backend.model;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** Server-only engine snapshot, independent of later catalogue edits. */
public record FrozenSimulationDefinition(Long instrumentId, String currency, String modelKey,
		String modelVersion, Map<String, Object> parameters) {
	public FrozenSimulationDefinition {
		parameters = Collections.unmodifiableMap(new LinkedHashMap<>(parameters));
	}
}
