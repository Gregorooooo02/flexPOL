package com.flexpol.backend.entity;

import java.util.Set;

/** EVALUATED is the replay lead-in; FINISHED, FAILED and CANCELLED are terminal. */
public enum DuelPhase {
	BRIEFING, PLANNING, EVALUATING, EVALUATED, REPLAY, FINISHED, CANCELLED, FAILED;

	public static final Set<DuelPhase> ACTIVE_PHASES = Set.of(BRIEFING, PLANNING, EVALUATING, EVALUATED, REPLAY);
	public static final Set<DuelPhase> TERMINAL_PHASES = Set.of(FINISHED, CANCELLED, FAILED);
}
