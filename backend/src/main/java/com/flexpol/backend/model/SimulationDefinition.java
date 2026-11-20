package com.flexpol.backend.model;

import java.time.LocalDate;

/** Detached database snapshot, prepared before simulation calculation begins. */
public record SimulationDefinition(
		Long instrumentId,
		String currency,
		LocalDate latestObservationDate,
		boolean historyRebased,
		SimulationConfigurationResponse configuration) {
}
