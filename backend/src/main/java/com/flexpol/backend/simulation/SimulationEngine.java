package com.flexpol.backend.simulation;

import com.flexpol.backend.model.SimulationContext;
import com.flexpol.backend.model.SimulationTrajectory;

/** Strategy selected by model key, never by asset class. */
public interface SimulationEngine {

	String modelKey();

	String modelVersion();

	SimulationTrajectory simulate(SimulationContext context);
}
