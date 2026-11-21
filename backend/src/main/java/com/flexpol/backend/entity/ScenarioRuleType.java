package com.flexpol.backend.entity;

/** How a scenario rule limits the share of its instruments. */
public enum ScenarioRuleType {
	/** Each listed instrument on its own stays at or below the maximum share. */
	MAX_SHARE_EACH,
	/** The listed instruments together stay at or below the maximum share. */
	MAX_TOTAL_SHARE
}
