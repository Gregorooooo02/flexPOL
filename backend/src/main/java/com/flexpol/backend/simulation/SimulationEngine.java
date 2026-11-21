package com.flexpol.backend.simulation;

import java.util.Map;

import com.flexpol.backend.model.SimulationContext;
import com.flexpol.backend.model.SimulationTrajectory;

/** Strategy selected by model key, never by asset class. */
public interface SimulationEngine {

	String modelKey();

	String modelVersion();

	/** Validate catalogue configuration without generating a market path. */
	void validateParameters(Map<String, Object> parameters);

	SimulationTrajectory simulate(SimulationContext context);
}
