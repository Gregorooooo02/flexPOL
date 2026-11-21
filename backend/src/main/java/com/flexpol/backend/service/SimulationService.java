package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import com.flexpol.backend.dto.SimulationRequest;
import com.flexpol.backend.dto.SimulationResult;
import com.flexpol.backend.model.SimulationContext;
import com.flexpol.backend.model.FrozenSimulationDefinition;
import com.flexpol.backend.simulation.SeedMixer;
import com.flexpol.backend.simulation.SimulationEngine;

import org.springframework.stereotype.Service;

@Service
public class SimulationService {

	private static final int MAX_DURATION_DAYS = 30 * 365;
	private static final int MAX_BATCH_SIZE = 50;
	private static final int MAX_BATCH_DURATION_DAYS = 10 * 365;
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
		if (request.durationDays() == null || request.durationDays() < 1
				|| request.durationDays() > MAX_DURATION_DAYS) {
			throw new IllegalArgumentException("Duration must be between 1 and " + MAX_DURATION_DAYS + " days");
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
		var end = start.plusDays(request.durationDays());
		// Generated seeds survive a JSON number round-trip through JavaScript clients.
		long seed = request.randomSeed() == null ? ThreadLocalRandom.current().nextLong(GENERATED_SEED_BOUND) : request.randomSeed();
		var trajectory = engine.simulate(new SimulationContext(initialInvestment, start, end, seed, configuration.parameters()));
		var finalValue = trajectory.points().getLast().investmentValue();
		var totalReturn = finalValue.subtract(initialInvestment).divide(initialInvestment, 8, RoundingMode.HALF_EVEN);

		return new SimulationResult(definition.instrumentId(), definition.currency(), initialInvestment,
				request.durationDays(), start, trajectory.effectiveEndDate(), seed,
				finalValue, totalReturn, trajectory.points());
	}

	/** Internal snapshot API: validate and version configuration, without generating a market. */
	public FrozenSimulationDefinition freezeDefinition(Long instrumentId) {
		var definition = instrumentService.getSimulationDefinition(instrumentId);
		var configuration = definition.configuration();
		var engine = engines.get(configuration.modelKey());
		if (engine == null) {
			throw new IllegalStateException("Unsupported configured simulation model: " + configuration.modelKey());
		}
		engine.validateParameters(configuration.parameters());
		return new FrozenSimulationDefinition(instrumentId, definition.currency(), engine.modelKey(),
				engine.modelVersion(), configuration.parameters());
	}

	/** Server-only common-date simulation. No catalogue reads, random seed generation or fallback. */
	public List<SimulationResult> simulateFrozen(List<FrozenSimulationDefinition> definitions, LocalDate start,
			int durationDays, BigDecimal baseAmount, long masterSeed) {
		if (definitions == null || definitions.isEmpty() || definitions.size() > MAX_BATCH_SIZE || start == null
				|| definitions.stream().anyMatch(Objects::isNull)
				|| durationDays < 1 || durationDays > MAX_BATCH_DURATION_DAYS || baseAmount == null
				|| baseAmount.signum() <= 0 || baseAmount.compareTo(MAX_INVESTMENT) > 0) {
			throw new IllegalStateException("Invalid frozen simulation inputs");
		}
		var base = baseAmount.setScale(2, RoundingMode.UNNECESSARY);
		var end = start.plusDays(durationDays);
		var ids = new HashSet<Long>();
		var results = new ArrayList<SimulationResult>();
		List<LocalDate> dates = null;
		String currency = definitions.getFirst().currency();
		for (var definition : definitions) {
			if (definition.instrumentId() == null || !ids.add(definition.instrumentId())
					|| currency == null || !currency.equals(definition.currency())) {
				throw new IllegalStateException("Frozen instruments must be distinct and share a currency");
			}
			var engine = engines.get(definition.modelKey());
			if (engine == null || !engine.modelVersion().equals(definition.modelVersion())) {
				throw new IllegalStateException("Frozen simulation engine version is unavailable");
			}
			engine.validateParameters(definition.parameters());
			long seed = SeedMixer.derive(masterSeed, definition.instrumentId());
			var trajectory = engine.simulate(new SimulationContext(base, start, end, seed, definition.parameters()));
			if (trajectory == null) {
				throw new IllegalStateException("Frozen simulation returned no trajectory");
			}
			var points = trajectory.points();
			if (points == null || points.size() < 2 || points.stream().anyMatch(Objects::isNull)
					|| !end.equals(trajectory.effectiveEndDate())
					|| !start.equals(points.getFirst().date()) || !end.equals(points.getLast().date())
					|| points.getFirst().investmentValue() == null
					|| points.getFirst().investmentValue().compareTo(base) != 0) {
				throw new IllegalStateException("Frozen simulation did not cover the requested horizon/base");
			}
			LocalDate previous = null;
			for (var point : points) {
				if (point.date() == null || (previous != null && !point.date().isAfter(previous))
						|| point.investmentValue() == null || point.investmentValue().signum() < 0) {
					throw new IllegalStateException("Invalid frozen simulation point");
				}
				previous = point.date();
			}
			var pointDates = points.stream().map(point -> point.date()).toList();
			if (dates != null && !dates.equals(pointDates)) {
				throw new IllegalStateException("Frozen simulations must align on every point date");
			}
			dates = pointDates;
			var finalValue = points.getLast().investmentValue();
			results.add(new SimulationResult(definition.instrumentId(), currency, base, durationDays, start, end, seed,
					finalValue, finalValue.subtract(base).divide(base, 8, RoundingMode.HALF_EVEN), List.copyOf(points)));
		}
		return List.copyOf(results);
	}

	/**
	 * Simulates several instruments over one shared timeline. An item without a seed gets an
	 * independent seed derived from a generated master seed and its instrument ID; an explicit
	 * seed is used as given. Results keep the request order and report the seed actually used.
	 */
	public List<SimulationResult> simulateBatch(List<SimulationRequest> requests) {
		if (requests == null || requests.isEmpty() || requests.size() > MAX_BATCH_SIZE) {
			throw new IllegalArgumentException("A batch must contain between 1 and " + MAX_BATCH_SIZE + " simulations");
		}
		Set<Long> instrumentIds = new HashSet<>();
		Integer durationDays = null;
		for (var request : requests) {
			if (request == null || request.instrumentId() == null) {
				throw new IllegalArgumentException("An instrument ID is required");
			}
			if (!instrumentIds.add(request.instrumentId())) {
				throw new IllegalArgumentException("Each instrument may appear only once in a batch");
			}
			if (request.durationDays() == null || request.durationDays() < 1
					|| request.durationDays() > MAX_BATCH_DURATION_DAYS) {
				throw new IllegalArgumentException("Batch duration must be between 1 and " + MAX_BATCH_DURATION_DAYS + " days");
			}
			if (durationDays != null && !durationDays.equals(request.durationDays())) {
				throw new IllegalArgumentException("All simulations in a batch must use the same duration");
			}
			durationDays = request.durationDays();
		}

		long masterSeed = ThreadLocalRandom.current().nextLong(GENERATED_SEED_BOUND);
		var results = requests.stream()
				.map(request -> simulate(request.randomSeed() != null ? request : new SimulationRequest(
						request.instrumentId(), request.initialInvestment(), request.durationDays(),
						SeedMixer.derive(masterSeed, request.instrumentId()))))
				.toList();

		var first = results.getFirst();
		for (var result : results) {
			if (!result.startDate().equals(first.startDate()) || !result.endDate().equals(first.endDate())) {
				throw new IllegalStateException("Instruments in a batch must share one start and end date");
			}
		}
		return results;
	}
}
