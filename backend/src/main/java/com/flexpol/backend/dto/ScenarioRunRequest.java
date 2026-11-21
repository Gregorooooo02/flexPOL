package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * A learner's one decision for a scenario: how much of the budget goes into each allowed
 * instrument. Whatever isn't allocated stays as cash, so an empty list means "all cash".
 */
public record ScenarioRunRequest(List<Allocation> allocations) {

	/** {@code amount} is in the scenario's currency, in whole cents. */
	public record Allocation(Long instrumentId, BigDecimal amount) {
	}
}
