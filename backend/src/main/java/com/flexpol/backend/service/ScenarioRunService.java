package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.flexpol.backend.dto.ScenarioResponse;
import com.flexpol.backend.dto.ScenarioRunRequest;
import com.flexpol.backend.dto.ScenarioRunResponse;
import com.flexpol.backend.dto.SimulationRequest;
import com.flexpol.backend.dto.SimulationResult;
import com.flexpol.backend.entity.ScenarioRuleType;
import com.flexpol.backend.exception.BadRequestException;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

/**
 * Runs a learner's allocation through a scenario and evaluates it, as described in
 * knowledge/sandbox-scenarios.md §4 (and mirrored by scripts/check-sandbox-scenarios.mjs).
 *
 * <p>Every invested instrument is simulated with {@code scenarioSeed + instrumentId}, so the
 * market is the same for every learner and every retry. Money needs are paid at the first point
 * on or after their day, from cash first, then by selling all holdings pro rata. Not
 * transactional: the scenario is read in {@link ScenarioService}'s own read-only transaction.
 */
@Service
@RequiredArgsConstructor
public class ScenarioRunService {

	private static final int FRACTION_SCALE = 6;
	/** Star weights from defaults.stars in knowledge/sandbox-scenarios.json. */
	private static final int GROWTH_STARS = 2;
	private static final int MIN_STARS = 1;

	private final ScenarioService scenarioService;
	private final SimulationService simulationService;

	public ScenarioRunResponse run(Long scenarioId, ScenarioRunRequest request) {
		return run(scenarioService.getRunSpec(scenarioId), request);
	}

	/** Runs an allocation with a spec the caller has already read (the coach also needs its debrief points). */
	public ScenarioRunResponse run(ScenarioRunSpec spec, ScenarioRunRequest request) {
		var brief = spec.brief();
		var allocations = validate(brief, request);

		List<SimulationRequest> items = new ArrayList<>();
		allocations.forEach((instrumentId, amount) -> items.add(
				new SimulationRequest(instrumentId, amount, brief.durationDays(), spec.seed() + instrumentId)));
		if (items.isEmpty()) {
			// All cash: simulate one allowed instrument only to get the scenario's timeline.
			Long timelineId = brief.instruments().getFirst().id();
			items.add(new SimulationRequest(timelineId, brief.budget(), brief.durationDays(), spec.seed() + timelineId));
		}
		var results = simulationService.simulateBatch(items);
		return evaluate(brief, spec.evaluation(), allocations, allocations.isEmpty() ? List.of() : results,
				results.getFirst());
	}

	/** Allocations in request order. Rejects unknown or repeated instruments, bad amounts and overspending. */
	static Map<Long, BigDecimal> validate(ScenarioResponse brief, ScenarioRunRequest request) {
		if (request == null || request.allocations() == null) {
			throw new BadRequestException("Send the allocations; an empty list keeps the whole budget in cash");
		}
		Set<Long> allowed = new HashSet<>();
		brief.instruments().forEach(instrument -> allowed.add(instrument.id()));

		Map<Long, BigDecimal> allocations = new LinkedHashMap<>();
		BigDecimal total = BigDecimal.ZERO;
		for (var allocation : request.allocations()) {
			if (allocation == null || allocation.instrumentId() == null) {
				throw new BadRequestException("Each allocation needs an instrumentId");
			}
			Long id = allocation.instrumentId();
			if (!allowed.contains(id)) {
				throw new BadRequestException("Instrument " + id + " isn't available in this scenario");
			}
			BigDecimal amount = allocation.amount();
			if (amount == null || amount.signum() <= 0) {
				throw new BadRequestException("The amount for instrument " + id + " must be positive");
			}
			if (amount.stripTrailingZeros().scale() > 2) {
				throw new BadRequestException("The amount for instrument " + id + " must be in whole cents");
			}
			if (allocations.putIfAbsent(id, amount.setScale(2)) != null) {
				throw new BadRequestException("Instrument " + id + " appears more than once");
			}
			total = total.add(amount);
		}
		if (total.compareTo(brief.budget()) > 0) {
			throw new BadRequestException("The allocations add up to more than the budget of " + brief.budget());
		}
		return allocations;
	}

	/**
	 * Walks the shared timeline. {@code results} holds one path per allocation (in the same order),
	 * or nothing for an all-cash run; {@code timeline} provides the dates either way.
	 */
	private static ScenarioRunResponse evaluate(ScenarioResponse brief, ScenarioRunSpec.Evaluation evaluation,
			Map<Long, BigDecimal> allocations, List<SimulationResult> results, SimulationResult timeline) {
		var scoring = brief.scoring();
		var dates = timeline.points().stream().map(point -> point.date()).toList();
		var start = timeline.startDate();
		int instrumentCount = results.size();
		double budget = brief.budget().doubleValue();
		double invested = allocations.values().stream().mapToDouble(BigDecimal::doubleValue).sum();

		double cash = budget - invested;
		// Paying a need from holdings sells the same fraction of every holding, so one factor scales them all.
		double holdingScale = 1;
		double paidOut = 0;
		double peak = budget;
		double largestDrop = 0;
		boolean shortfall = false;
		double[] sold = new double[instrumentCount];

		var needs = brief.moneyNeeds().stream()
				.sorted(Comparator.comparingInt(ScenarioResponse.MoneyNeed::day))
				.toList();
		int nextNeed = 0;
		List<ScenarioRunResponse.MoneyNeedRun> needRuns = new ArrayList<>();
		List<ScenarioRunResponse.Point> points = new ArrayList<>(dates.size());
		List<List<BigDecimal>> instrumentValues = new ArrayList<>();
		for (int j = 0; j < instrumentCount; j++) {
			instrumentValues.add(new ArrayList<>(dates.size()));
		}

		for (int i = 0; i < dates.size(); i++) {
			long dayOffset = ChronoUnit.DAYS.between(start, dates.get(i));
			double[] raw = new double[instrumentCount];
			double rawTotal = 0;
			for (int j = 0; j < instrumentCount; j++) {
				raw[j] = results.get(j).points().get(i).investmentValue().doubleValue();
				rawTotal += raw[j];
			}

			while (nextNeed < needs.size() && dayOffset >= needs.get(nextNeed).day()) {
				var need = needs.get(nextNeed);
				double due = need.amount().doubleValue();
				double fromCash = Math.min(cash, due);
				cash -= fromCash;
				due -= fromCash;
				double held = holdingScale * rawTotal;
				double fromHoldings = 0;
				double missing = 0;
				if (due > 0) {
					double fraction = held > due ? due / held : 1;
					for (int j = 0; j < instrumentCount; j++) {
						sold[j] += holdingScale * raw[j] * fraction;
					}
					fromHoldings = Math.min(held, due);
					missing = due - fromHoldings;
					holdingScale *= 1 - fraction;
					shortfall |= missing > 0.005;
				}
				paidOut += fromCash + fromHoldings;
				needRuns.add(new ScenarioRunResponse.MoneyNeedRun(need.day(), need.label(), need.amount(),
						dates.get(i), i, cents(fromCash), cents(fromHoldings), cents(missing)));
				nextNeed++;
			}

			BigDecimal cashCents = cents(cash);
			BigDecimal value = cashCents;
			for (int j = 0; j < instrumentCount; j++) {
				BigDecimal instrumentValue = cents(holdingScale * raw[j]);
				instrumentValues.get(j).add(instrumentValue);
				value = value.add(instrumentValue);
			}
			points.add(new ScenarioRunResponse.Point(dates.get(i), value, cashCents));

			// Measured with the money paid out added back, so a planned bill doesn't count as a loss.
			double performance = value.doubleValue() + paidOut;
			peak = Math.max(peak, performance);
			largestDrop = Math.max(largestDrop, 1 - performance / peak);
		}

		List<ScenarioRunResponse.InstrumentRun> instruments = new ArrayList<>();
		int j = 0;
		for (var allocation : allocations.entrySet()) {
			var values = instrumentValues.get(j);
			var finalValue = values.getLast();
			var contribution = finalValue.add(cents(sold[j])).subtract(allocation.getValue());
			instruments.add(new ScenarioRunResponse.InstrumentRun(allocation.getKey(), allocation.getValue(),
					List.copyOf(values), finalValue, contribution));
			j++;
		}

		BigDecimal finalValue = points.getLast().value();
		BigDecimal paidOutCents = cents(paidOut);
		BigDecimal totalReturn = finalValue.add(paidOutCents).subtract(brief.budget())
				.divide(brief.budget(), FRACTION_SCALE, RoundingMode.HALF_EVEN);
		boolean goalMet = !shortfall && finalValue.compareTo(scoring.target()) >= 0;

		boolean grew = finalValue.add(paidOutCents).compareTo(brief.budget()) > 0;

		return new ScenarioRunResponse(brief.id(), brief.currency(), brief.budget(), brief.durationDays(),
				start, timeline.endDate(), points, instruments, needRuns, finalValue, paidOutCents, totalReturn,
				BigDecimal.valueOf(largestDrop).setScale(FRACTION_SCALE, RoundingMode.HALF_EVEN), goalMet,
				score(brief, allocations, finalValue.doubleValue(), largestDrop, shortfall),
				stars(evaluation, allocations, brief.budget(), grew, goalMet));
	}

	/**
	 * The 1–5 star rating (defaults.stars in knowledge/sandbox-scenarios.json, mirrored by
	 * scripts/check-sandbox-scenarios.mjs). Assets and shares are judged on the allocation at the
	 * start, exactly, in cents; growth and goal on the run's result.
	 */
	static ScenarioRunResponse.StarRating stars(ScenarioRunSpec.Evaluation evaluation, Map<Long, BigDecimal> allocations,
			BigDecimal budget, boolean grew, boolean goalMet) {
		var suitable = Set.copyOf(evaluation.suitableInstrumentIds());
		List<Long> unsuitable = allocations.keySet().stream().filter(id -> !suitable.contains(id)).toList();
		boolean rightAssets = unsuitable.isEmpty() && allocations.size() >= evaluation.minInstruments();

		BigDecimal cash = budget.subtract(allocations.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add));
		List<ScenarioRunResponse.ShareRangeResult> ranges = evaluation.shareRanges().stream()
				.map(range -> shareRange(range, allocations, cash, budget))
				.toList();
		boolean rightShares = ranges.stream().allMatch(ScenarioRunResponse.ShareRangeResult::met);

		var criteria = List.of(
				new ScenarioRunResponse.StarCriterion(ScenarioRunResponse.StarCriterionKey.GROWTH, GROWTH_STARS, grew),
				new ScenarioRunResponse.StarCriterion(ScenarioRunResponse.StarCriterionKey.GOAL, 1, goalMet),
				new ScenarioRunResponse.StarCriterion(ScenarioRunResponse.StarCriterionKey.ASSETS, 1, rightAssets),
				new ScenarioRunResponse.StarCriterion(ScenarioRunResponse.StarCriterionKey.SHARES, 1, rightShares));
		int earned = criteria.stream().filter(ScenarioRunResponse.StarCriterion::earned)
				.mapToInt(ScenarioRunResponse.StarCriterion::stars).sum();

		return new ScenarioRunResponse.StarRating(Math.max(MIN_STARS, earned), earned, criteria,
				evaluation.suitableInstrumentIds(), evaluation.minInstruments(), unsuitable, ranges,
				evaluation.explanation());
	}

	/** Compares amounts with {@code share × budget}, so 70% of €6,000 is exactly €4,200. */
	private static ScenarioRunResponse.ShareRangeResult shareRange(ScenarioRunSpec.ShareRange range,
			Map<Long, BigDecimal> allocations, BigDecimal cash, BigDecimal budget) {
		BigDecimal low = range.min().multiply(budget);
		BigDecimal high = range.max().multiply(budget);
		BigDecimal amount;
		boolean met;
		if (range.each()) {
			var amounts = range.instrumentIds().stream()
					.map(id -> allocations.getOrDefault(id, BigDecimal.ZERO))
					.toList();
			amount = amounts.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
			met = amounts.stream().allMatch(value -> value.compareTo(low) >= 0 && value.compareTo(high) <= 0);
		} else {
			amount = range.instrumentIds().stream()
					.map(id -> allocations.getOrDefault(id, BigDecimal.ZERO))
					.reduce(range.includesCash() ? cash : BigDecimal.ZERO, BigDecimal::add);
			met = amount.compareTo(low) >= 0 && amount.compareTo(high) <= 0;
		}
		BigDecimal share = amount.divide(budget, FRACTION_SCALE, RoundingMode.HALF_EVEN);
		return new ScenarioRunResponse.ShareRangeResult(range.label(), range.includesCash(), range.each(),
				range.instrumentIds(), range.min(), range.max(), share, met);
	}

	private static ScenarioRunResponse.Score score(ScenarioResponse brief, Map<Long, BigDecimal> allocations,
			double finalValue, double largestDrop, boolean shortfall) {
		var scoring = brief.scoring();
		double target = scoring.target().doubleValue();
		double floor = scoring.floor().doubleValue();
		double maxDrawdown = scoring.maxDrawdown().doubleValue();

		double growth;
		if (shortfall) {
			growth = 0;
		} else if (target > floor) {
			growth = 100 * clamp((finalValue - floor) / (target - floor));
		} else {
			growth = finalValue >= target ? 100 : 0;
		}
		double stability = maxDrawdown > 0
				? 100 * clamp(1 - Math.max(0, largestDrop - maxDrawdown) / maxDrawdown)
				: (largestDrop > 0 ? 0 : 100);

		List<String> brokenRules = brief.rules().stream()
				.filter(rule -> breaks(rule, allocations, brief.budget()))
				.map(ScenarioResponse.Rule::label)
				.toList();
		int penalty = brokenRules.size() * scoring.rulePenaltyPoints();
		double total = scoring.growthWeight().doubleValue() * growth
				+ scoring.stabilityWeight().doubleValue() * stability - penalty;

		return new ScenarioRunResponse.Score((int) Math.round(Math.min(100, Math.max(0, total))),
				(int) Math.round(growth), (int) Math.round(stability), scoring.growthWeight(),
				scoring.stabilityWeight(), penalty, brokenRules);
	}

	/** Rules compare shares of the budget, so they're checked exactly: amount > maxShare × budget. */
	static boolean breaks(ScenarioResponse.Rule rule, Map<Long, BigDecimal> allocations, BigDecimal budget) {
		BigDecimal limit = rule.maxShare().multiply(budget);
		var amounts = rule.instrumentIds().stream()
				.map(id -> allocations.getOrDefault(id, BigDecimal.ZERO))
				.toList();
		if (rule.type() == ScenarioRuleType.MAX_SHARE_EACH) {
			return amounts.stream().anyMatch(amount -> amount.compareTo(limit) > 0);
		}
		return amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add).compareTo(limit) > 0;
	}

	private static double clamp(double value) {
		return Math.min(1, Math.max(0, value));
	}

	private static BigDecimal cents(double amount) {
		return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_EVEN);
	}
}
