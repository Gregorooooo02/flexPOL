package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import com.flexpol.backend.dto.ScenarioResponse;
import com.flexpol.backend.dto.ScenarioRunRequest;
import com.flexpol.backend.dto.ScenarioRunResponse;
import com.flexpol.backend.exception.BadRequestException;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

/**
 * Describes the sandbox scenario the learner is in as plain text for the coach's system prompt:
 * the brief, the learner's plan and, once they have run it, the result.
 *
 * <p>Before a run the text holds only what the scenario screen shows: no suitable instruments,
 * share ranges, explanation or debrief points, and no outcome. After a run the plan is run again
 * here on the scenario's fixed market (the same result the learner saw), so the coach discusses
 * the real numbers rather than numbers sent by the client. Not transactional: the scenario is read
 * in {@link ScenarioService}'s own read-only transaction and the simulation runs outside it.
 */
@Service
@RequiredArgsConstructor
public class CoachScenarioContextService {

	private final ScenarioService scenarioService;
	private final ScenarioRunService scenarioRunService;

	/**
	 * @param allocations the learner's plan in the scenario's currency (the rest stays cash), or null if unknown
	 * @param ran whether the learner has run this plan and sees its result
	 */
	public String scenarioContext(Long scenarioId, List<ScenarioRunRequest.Allocation> allocations, boolean ran) {
		if (ran && allocations == null) {
			throw new BadRequestException("scenarioRun requires allocations");
		}
		var spec = scenarioService.getRunSpec(scenarioId);
		var brief = spec.brief();
		var request = allocations == null ? null : new ScenarioRunRequest(allocations);
		Map<Long, BigDecimal> plan = request == null ? null : ScenarioRunService.validate(brief, request);
		Map<Long, String> names = brief.instruments().stream().collect(Collectors.toMap(
				ScenarioResponse.AllowedInstrument::id, ScenarioResponse.AllowedInstrument::name));

		StringBuilder text = new StringBuilder();
		appendBrief(text, brief, names);
		appendPlan(text, brief, plan, names);
		if (!ran) {
			return text.append("\nThey have not seen a result for this plan yet. Help them check whether it fits the goal, ")
					.append("the horizon and the money needs, with hints and questions. Do not predict how it will do or ")
					.append("invent numbers. Which instruments and shares the star rating counts as suitable is revealed ")
					.append("only after the run, so do not hand over an allocation to copy; help them decide.")
					.toString();
		}
		var run = scenarioRunService.run(spec, request);
		appendResult(text, brief, run, names);
		text.append("\nWhat fits ").append(brief.persona().name()).append(": ").append(run.stars().explanation()).append('\n');
		if (!spec.debriefPoints().isEmpty()) {
			text.append("Points the debrief should bring out:\n");
			spec.debriefPoints().forEach(point -> text.append("- ").append(point).append('\n'));
		}
		return text.append("\nGive feedback on their choices and this result: what fits the goal, the horizon and the money ")
				.append("needs and what does not, which tradeoff the run showed, and why each star was or was not earned. ")
				.append("This is one simulated path, so luck plays a part: judge the plan by how well it fits ")
				.append(brief.persona().name()).append(", not only by its return. Use only the numbers above. End with one ")
				.append("or two ideas they could test with Change plan, as ideas to try rather than an exact allocation to copy.")
				.toString();
	}

	private static void appendBrief(StringBuilder text, ScenarioResponse brief, Map<Long, String> names) {
		String currency = brief.currency();
		var persona = brief.persona();
		text.append("Scenario ").append(brief.code()).append(" \"").append(brief.title()).append("\" (chapter ")
				.append(brief.chapterNumber()).append(": ").append(brief.chapterTitle()).append(").\n")
				.append("Fictional money and synthetic prices: one simulated market, the same for every learner and every ")
				.append("retry. Instruments move independently, cash earns 0%, money needed along the way is paid from cash ")
				.append("first and then by selling the same share of every holding, and there are no fees, taxes or inflation.\n\n")
				.append("Person: ").append(persona.name());
		if (persona.age() != null) {
			text.append(", ").append(persona.age());
		}
		text.append(". ").append(persona.situation()).append('\n')
				.append("Goal: ").append(brief.goal()).append('\n')
				.append("Budget: ").append(money(currency, brief.budget())).append(". Horizon: ")
				.append(brief.durationDays()).append(" days.\n");
		if (brief.retirementGap() != null) {
			text.append("Retirement gap: ").append(money(currency, brief.retirementGap())).append(".\n");
		}
		if (brief.moneyNeeds().isEmpty()) {
			text.append("Money needed along the way: none.\n");
		} else {
			text.append("Money needed along the way:\n");
			brief.moneyNeeds().forEach(need -> text.append("- Day ").append(need.day()).append(": ")
					.append(money(currency, need.amount())).append(" (").append(need.label()).append(")\n"));
		}
		text.append("Allowed instruments (cash is always available too):\n");
		brief.instruments().forEach(instrument -> text.append("- ").append(instrument.name()).append(" (")
				.append(instrument.assetClass()).append(", risk ").append(instrument.riskLevel()).append(")\n"));
		if (brief.rules().isEmpty()) {
			text.append("Rules: none.\n");
		} else {
			text.append("Rules (breaking one costs a star):\n");
			brief.rules().forEach(rule -> text.append("- ").append(rule.label()).append(" (")
					.append(instrumentNames(rule.instrumentIds(), names)).append(")\n"));
		}
		var scoring = brief.scoring();
		text.append("The goal is reached when the final value is at least ").append(money(currency, scoring.target()))
				.append(" and every money need was paid. ").append(persona.name()).append(" can live with a drop of up to ")
				.append(percent(scoring.maxDrawdown())).append(".\n")
				.append("Star rating (1 to 5): 2 stars when the final value plus money paid out ends above the budget, ")
				.append("1 for reaching the goal, 1 for suitable instruments, 1 for suitable shares of the budget.\n");
		if (!brief.lessons().isEmpty()) {
			text.append("Lessons it practises: ").append(brief.lessons().stream()
					.map(lesson -> lesson.code() + " " + lesson.title())
					.collect(Collectors.joining("; "))).append(".\n");
		}
		if (!brief.notSimulated().isEmpty()) {
			text.append("Not simulated: ").append(String.join(" ", brief.notSimulated())).append('\n');
		}
	}

	private static void appendPlan(StringBuilder text, ScenarioResponse brief, Map<Long, BigDecimal> plan,
			Map<Long, String> names) {
		if (plan == null) {
			text.append("\nTheir plan is not known.\n");
			return;
		}
		String currency = brief.currency();
		BigDecimal budget = brief.budget();
		BigDecimal cash = budget.subtract(plan.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add));
		text.append("\nTheir plan at the start:\n");
		plan.forEach((id, amount) -> text.append("- ").append(names.get(id)).append(": ")
				.append(money(currency, amount)).append(" (").append(percent(share(amount, budget))).append(")\n"));
		text.append("- Cash: ").append(money(currency, cash)).append(" (").append(percent(share(cash, budget))).append(")\n");
		brief.rules().forEach(rule -> text.append("Rule \"").append(rule.label()).append("\": ")
				.append(ScenarioRunService.breaks(rule, plan, budget) ? "broken" : "kept").append(".\n"));
	}

	private static void appendResult(StringBuilder text, ScenarioResponse brief, ScenarioRunResponse run,
			Map<Long, String> names) {
		String currency = brief.currency();
		BigDecimal gain = run.finalValue().add(run.paidOut()).subtract(run.budget());
		text.append("\nThey ran this plan and see this result, computed by the simulation:\n")
				.append("- Final value: ").append(money(currency, run.finalValue())).append(" after paying out ")
				.append(money(currency, run.paidOut())).append(". Gain including money paid out: ")
				.append(signedMoney(currency, gain)).append(" (").append(signedPercent(run.totalReturn())).append(").\n")
				.append("- Largest drop along the way: ").append(percent(run.largestDrop())).append(" (")
				.append(brief.persona().name()).append(" can live with ").append(percent(brief.scoring().maxDrawdown()))
				.append(").\n");
		run.moneyNeeds().forEach(need -> {
			text.append("- ").append(need.label()).append(" (day ").append(need.day()).append(", ")
					.append(money(currency, need.amount())).append("): ")
					.append(money(currency, need.paidFromCash())).append(" from cash, ")
					.append(money(currency, need.paidFromHoldings())).append(" from selling holdings");
			text.append(need.shortfall().signum() > 0
					? ", short by " + money(currency, need.shortfall()) + ".\n"
					: ", fully paid.\n");
		});
		run.instruments().forEach(instrument -> text.append("- ").append(names.get(instrument.instrumentId()))
				.append(": invested ").append(money(currency, instrument.amount())).append(", worth ")
				.append(money(currency, instrument.finalValue())).append(" at the end, net contribution ")
				.append(signedMoney(currency, instrument.contribution()))
				.append(run.moneyNeeds().isEmpty() ? ".\n" : " (including anything sold to pay money needs).\n"));
		text.append("- Goal: ").append(run.goalMet() ? "reached" : "not reached").append(".\n");
		var brokenRules = run.score().brokenRules();
		text.append("- Broken rules: ").append(brokenRules.isEmpty() ? "none" : String.join("; ", brokenRules)).append(".\n");

		var stars = run.stars();
		text.append("Stars: ").append(stars.stars()).append(" of 5");
		if (stars.earned() == 0) {
			text.append(" (no criterion earned; every run gets at least one star)");
		}
		text.append(".\n");
		for (var criterion : stars.criteria()) {
			text.append("- ").append(criterionTitle(criterion.key())).append(" (").append(criterion.stars())
					.append(criterion.stars() == 1 ? " star" : " stars").append("): ")
					.append(criterion.earned() ? "earned" : "missed").append('.');
			switch (criterion.key()) {
				case GROWTH -> text.append(" Final value plus money paid out ")
						.append(gain.signum() > 0 ? "ended above" : "did not end above").append(" the budget.");
				case GOAL -> { }
				case ASSETS -> {
					text.append(" Suitable here: ").append(instrumentNames(stars.suitableInstrumentIds(), names))
							.append(stars.minInstruments() == 0
									? "; all cash also counts."
									: "; at least " + stars.minInstruments() + " of them.");
					if (!stars.unsuitableInstrumentIds().isEmpty()) {
						text.append(" Unsuitable picks: ").append(instrumentNames(stars.unsuitableInstrumentIds(), names)).append('.');
					}
				}
				case SHARES -> stars.shareRanges().forEach(range -> text.append(" ").append(range.label()).append(": ")
						.append(range.each() ? "largest single share " : "").append(percent(range.share()))
						.append(" (suitable range ").append(percent(range.min())).append(" to ").append(percent(range.max()))
						.append(", ").append(range.met() ? "inside" : "outside").append(")."));
			}
			text.append('\n');
		}
	}

	/** Matches the titles on the result screen (frontend resultText.ts). */
	private static String criterionTitle(ScenarioRunResponse.StarCriterionKey key) {
		return switch (key) {
			case GROWTH -> "Growth";
			case GOAL -> "Goal reached";
			case ASSETS -> "Right instruments";
			case SHARES -> "Right shares";
		};
	}

	private static String instrumentNames(List<Long> ids, Map<Long, String> names) {
		return ids.isEmpty() ? "none" : ids.stream()
				.map(id -> names.getOrDefault(id, "instrument " + id))
				.collect(Collectors.joining(", "));
	}

	private static BigDecimal share(BigDecimal amount, BigDecimal budget) {
		return amount.divide(budget, 6, RoundingMode.HALF_EVEN);
	}

	private static String money(String currency, BigDecimal amount) {
		String number = String.format(Locale.ROOT, "%,.2f", amount.abs());
		String sign = amount.signum() < 0 ? "-" : "";
		return "EUR".equals(currency) ? sign + "€" + number : sign + number + " " + currency;
	}

	private static String signedMoney(String currency, BigDecimal amount) {
		return (amount.signum() > 0 ? "+" : "") + money(currency, amount);
	}

	/** A fraction as a percentage with at most one decimal, e.g. 0.7 → "70%". */
	private static String percent(BigDecimal fraction) {
		return fraction.movePointRight(2).setScale(1, RoundingMode.HALF_EVEN).stripTrailingZeros().toPlainString() + "%";
	}

	private static String signedPercent(BigDecimal fraction) {
		return (fraction.signum() > 0 ? "+" : "") + percent(fraction);
	}
}
