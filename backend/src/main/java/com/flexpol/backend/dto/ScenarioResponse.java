package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.flexpol.backend.entity.Scenario;
import com.flexpol.backend.entity.ScenarioMoneyNeed;
import com.flexpol.backend.entity.ScenarioRule;
import com.flexpol.backend.entity.ScenarioRuleType;
import com.flexpol.backend.model.Instrument;
import com.flexpol.backend.model.enums.AssetClass;
import com.flexpol.backend.model.enums.RiskLevel;

/**
 * A sandbox scenario's brief: who the person is, the goal, the budget and horizon, the money needed
 * along the way, the allowed instruments, the advisory rules and the (transparent) scoring
 * parameters. The scenario seed, reference allocations, traps and debrief points are left out on
 * purpose: they would reveal the market path or the answer before the learner has submitted.
 */
public record ScenarioResponse(
		Long id,
		String slug,
		String code,
		Integer sortOrder,
		Long chapterId,
		Integer chapterNumber,
		String chapterTitle,
		String title,
		Persona persona,
		String goal,
		String currency,
		BigDecimal budget,
		Integer durationDays,
		List<MoneyNeed> moneyNeeds,
		List<AllowedInstrument> instruments,
		List<Rule> rules,
		Scoring scoring,
		BigDecimal retirementGap,
		List<SubchapterSummaryResponse> lessons,
		List<String> notSimulated) {

	public record Persona(String name, Integer age, String situation) {
	}

	/** Paid on the first simulated point on or after {@code day}, from cash first. */
	public record MoneyNeed(Integer day, BigDecimal amount, String label) {

		static MoneyNeed from(ScenarioMoneyNeed need) {
			return new MoneyNeed(need.getDay(), need.getAmount(), need.getLabel());
		}
	}

	/** A catalogue instrument the scenario allows; cash is always available as well. */
	public record AllowedInstrument(Long id, String name, AssetClass assetClass, RiskLevel riskLevel) {

		static AllowedInstrument from(Instrument instrument) {
			return new AllowedInstrument(instrument.getId(), instrument.getName(), instrument.getAssetClass(),
					instrument.getRiskLevel());
		}
	}

	/** An advisory rule; {@code maxShare} is a fraction of the budget. */
	public record Rule(ScenarioRuleType type, BigDecimal maxShare, String label, List<Long> instrumentIds) {

		static Rule from(ScenarioRule rule) {
			return new Rule(rule.getRuleType(), rule.getMaxShare(), rule.getLabel(),
					rule.getInstruments().stream().map(Instrument::getId).toList());
		}
	}

	/** Parameters of the score formula in knowledge/sandbox-scenarios.md §4; drops are fractions. */
	public record Scoring(
			BigDecimal target,
			BigDecimal floor,
			BigDecimal maxDrawdown,
			BigDecimal growthWeight,
			BigDecimal stabilityWeight,
			Integer rulePenaltyPoints) {
	}

	public static ScenarioResponse from(Scenario scenario) {
		var chapter = scenario.getChapter();
		return new ScenarioResponse(
				scenario.getId(),
				scenario.getSlug(),
				scenario.getCode(),
				scenario.getSortOrder(),
				chapter.getId(),
				chapter.getSortOrder(),
				chapter.getTitle(),
				scenario.getTitle(),
				new Persona(scenario.getPersonaName(), scenario.getPersonaAge(), scenario.getPersonaSituation()),
				scenario.getGoal(),
				scenario.getCurrency(),
				scenario.getBudget(),
				scenario.getDurationDays(),
				scenario.getMoneyNeeds().stream().map(MoneyNeed::from).toList(),
				scenario.getInstruments().stream().map(AllowedInstrument::from).toList(),
				scenario.getRules().stream().map(Rule::from).toList(),
				new Scoring(scenario.getTarget(), scenario.getFloor(), scenario.getMaxDrawdown(),
						scenario.getGrowthWeight(), scenario.getStabilityWeight(), scenario.getRulePenaltyPoints()),
				scenario.getRetirementGap(),
				scenario.getLessons().stream().map(SubchapterSummaryResponse::from).toList(),
				List.copyOf(scenario.getNotSimulated()));
	}
}
