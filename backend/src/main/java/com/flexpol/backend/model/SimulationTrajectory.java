package com.flexpol.backend.model;

import java.time.LocalDate;
import java.util.List;

/** A computed path whose effective end may be shortened by product maturity. */
public record SimulationTrajectory(
		LocalDate effectiveEndDate,
		List<SimulationPoint> points,
		List<String> limitations) {
}
