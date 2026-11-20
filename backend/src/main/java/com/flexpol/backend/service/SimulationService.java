package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import com.flexpol.backend.dto.SimulationRequest;
import com.flexpol.backend.dto.SimulationResult;
import com.flexpol.backend.model.SimulationContext;
import com.flexpol.backend.simulation.SimulationEngine;

import org.springframework.stereotype.Service;

@Service
public class SimulationService {

	private static final int MAX_DURATION_MONTHS = 360;
	private static final BigDecimal MAX_INVESTMENT = new BigDecimal("1000000000000");
	private static final long GENERATED_SEED_BOUND = 1L << 53;

	private final InstrumentService instrumentService;
	private final Map<String, SimulationEngine> engines;

	public SimulationService(InstrumentService instrumentService, List<SimulationEngine> engines) {
		this.instrumentService = instrumentService;
		Map<String, SimulationEngine> registry = new HashMap<>();
		for (var engine : engines) {
			if (registry.putIfAbsent(engine.modelKey(), engine) != null) {
				throw new IllegalStateException("Duplicate simulation model key: " + engine.modelKey());
			}
		}
		this.engines = Map.copyOf(registry);
	}

	public SimulationResult simulate(SimulationRequest request) {
		if (request == null || request.instrumentId() == null) {
			throw new IllegalArgumentException("An instrument ID is required");
		}
		if (request.durationMonths() == null || request.durationMonths() < 1
				|| request.durationMonths() > MAX_DURATION_MONTHS) {
			throw new IllegalArgumentException("Duration must be between 1 and " + MAX_DURATION_MONTHS + " months");
		}
		if (request.initialInvestment() == null || request.initialInvestment().signum() <= 0
				|| request.initialInvestment().compareTo(MAX_INVESTMENT) > 0) {
			throw new IllegalArgumentException("Investment must be positive and no greater than " + MAX_INVESTMENT);
		}
		var initialInvestment = request.initialInvestment().setScale(2, RoundingMode.HALF_EVEN);
		if (initialInvestment.signum() == 0) {
			throw new IllegalArgumentException("Investment must round to at least one cent");
		}

		// InstrumentService finishes its read-only transaction before calculation starts.
		var definition = instrumentService.getSimulationDefinition(request.instrumentId());
		var configuration = definition.configuration();
		var engine = engines.get(configuration.modelKey());
		if (engine == null) {
			throw new IllegalStateException("Unsupported configured simulation model: " + configuration.modelKey());
		}
		var start = definition.latestObservationDate() == null ? LocalDate.now() : definition.latestObservationDate();
		var end = start.plusMonths(request.durationMonths());
		// Generated seeds survive a JSON number round-trip through JavaScript clients.
		long seed = request.randomSeed() == null ? ThreadLocalRandom.current().nextLong(GENERATED_SEED_BOUND) : request.randomSeed();
		var trajectory = engine.simulate(new SimulationContext(initialInvestment, start, end, seed, configuration.parameters()));
		var finalValue = trajectory.points().getLast().investmentValue();
		var totalReturn = finalValue.subtract(initialInvestment).divide(initialInvestment, 8, RoundingMode.HALF_EVEN);

		return new SimulationResult(definition.instrumentId(), definition.currency(), initialInvestment,
				request.durationMonths(), start, trajectory.effectiveEndDate(), seed,
				finalValue, totalReturn, trajectory.points());
	}
}
