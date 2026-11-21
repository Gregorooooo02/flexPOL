package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * The result of running a learner's allocation through a scenario's market (see
 * knowledge/sandbox-scenarios.md §4). Money is in {@code currency}, rounded to cents; drops and
 * returns are fractions. {@code points} and every instrument's {@code values} share one timeline:
 * the start, each weekday, and possibly a carried-forward end point.
 */
public record ScenarioRunResponse(
		Long scenarioId,
		String currency,
		BigDecimal budget,
		Integer durationDays,
		LocalDate startDate,
		LocalDate endDate,
		List<Point> points,
		List<InstrumentRun> instruments,
		List<MoneyNeedRun> moneyNeeds,
		BigDecimal finalValue,
		BigDecimal paidOut,
		BigDecimal totalReturn,
		BigDecimal largestDrop,
		boolean goalMet,
		Score score,
		StarRating stars) {

	/** What a star criterion checks. Growth is worth two stars, the others one each. */
	public enum StarCriterionKey {
		GROWTH, GOAL, ASSETS, SHARES
	}

	/**
	 * The 1–5 star rating: two stars for growth (final value plus money paid out above the
	 * budget), one for reaching the goal, one for suitable instruments, one for shares inside every
	 * range. {@code earned} is the plain sum (0–5); {@code stars} never goes below one. The
	 * suitable instruments, ranges and explanation are revealed here, after the learner submitted.
	 */
	public record StarRating(
			int stars,
			int earned,
			List<StarCriterion> criteria,
			List<Long> suitableInstrumentIds,
			int minInstruments,
			List<Long> unsuitableInstrumentIds,
			List<ShareRangeResult> shareRanges,
			String explanation) {
	}

	public record StarCriterion(StarCriterionKey key, int stars, boolean earned) {
	}

	/**
	 * One range of the shares star with the learner's share of the budget. For an {@code each}
	 * range, {@code share} is the largest share among its instruments.
	 */
	public record ShareRangeResult(
			String label,
			boolean includesCash,
			boolean each,
			List<Long> instrumentIds,
			BigDecimal min,
			BigDecimal max,
			BigDecimal share,
			boolean met) {
	}

	/** Cash plus holdings on one date, after the money needs paid so far. */
	public record Point(LocalDate date, BigDecimal value, BigDecimal cash) {
	}

	/**
	 * One invested instrument. {@code values} follows {@code points}; it shrinks when holdings are
	 * sold to pay a money need. {@code contribution} is the final value plus what was sold, minus
	 * the amount invested.
	 */
	public record InstrumentRun(
			Long instrumentId,
			BigDecimal amount,
			List<BigDecimal> values,
			BigDecimal finalValue,
			BigDecimal contribution) {
	}

	/** How one money need was paid, at the first point on or after its day. */
	public record MoneyNeedRun(
			Integer day,
			String label,
			BigDecimal amount,
			LocalDate date,
			Integer pointIndex,
			BigDecimal paidFromCash,
			BigDecimal paidFromHoldings,
			BigDecimal shortfall) {
	}

	/**
	 * The 0–100 score: {@code growthWeight × growth + stabilityWeight × stability − rulePenalty},
	 * clamped. The parts are 0–100 too; {@code brokenRules} lists the labels of the broken rules.
	 */
	public record Score(
			int total,
			int growth,
			int stability,
			BigDecimal growthWeight,
			BigDecimal stabilityWeight,
			int rulePenalty,
			List<String> brokenRules) {
	}
}
