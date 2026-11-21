package com.flexpol.backend.entity;

/** EVALUATED awaits future replay/settlement; FAILED and CANCELLED are terminal. */
public enum DuelPhase {
	BRIEFING, PLANNING, EVALUATING, EVALUATED, CANCELLED, FAILED
}
