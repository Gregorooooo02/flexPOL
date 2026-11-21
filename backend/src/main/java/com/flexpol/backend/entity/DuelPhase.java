package com.flexpol.backend.entity;

/** EVALUATED is the replay lead-in; FINISHED, FAILED and CANCELLED are terminal. */
public enum DuelPhase {
	BRIEFING, PLANNING, EVALUATING, EVALUATED, REPLAY, FINISHED, CANCELLED, FAILED
}
