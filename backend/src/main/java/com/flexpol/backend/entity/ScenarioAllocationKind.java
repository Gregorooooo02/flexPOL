package com.flexpol.backend.entity;

/** What a stored scenario allocation is for. */
public enum ScenarioAllocationKind {
	/** The allocation the scenario was calibrated for (average score at least 80). */
	REFERENCE,
	/** Another allocation that also fits the goal. */
	ACCEPTABLE,
	/** A tempting allocation that doesn't fit (average score at most 50). */
	TRAP
}
