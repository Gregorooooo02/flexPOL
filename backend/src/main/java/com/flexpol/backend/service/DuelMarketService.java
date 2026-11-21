package com.flexpol.backend.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import com.flexpol.backend.model.DuelMarketSpec;
import com.flexpol.backend.model.DuelScenarioSpec;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DuelMarketService {

	private static final SecureRandom SEEDS = new SecureRandom();
	private final SimulationService simulationService;

	/** Called once, in the match creation transaction, separately from visible-template randomness. */
	public DuelMarketSpec freeze(DuelScenarioSpec scenario, Instant createdAt) {
		var definitions = scenario.instruments().stream()
				.map(instrument -> simulationService.freezeDefinition(instrument.id())).toList();
		if (definitions.isEmpty() || definitions.size() > 50
				|| definitions.stream().anyMatch(definition -> !scenario.currency().equals(definition.currency()))) {
			throw new IllegalStateException("Duel market requires 1–50 instruments in the scenario currency");
		}
		return new DuelMarketSpec(1, DuelMarketSpec.VALUATION_VERSION, LocalDate.ofInstant(createdAt, ZoneOffset.UTC),
				scenario.durationDays(), DuelMarketSpec.BASE_AMOUNT, SEEDS.nextLong(), definitions);
	}
}
