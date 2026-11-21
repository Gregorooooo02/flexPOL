package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.util.List;

import com.flexpol.backend.dto.ScenarioResponse;
import com.flexpol.backend.entity.Scenario;
import com.flexpol.backend.entity.ScenarioShareRange;
import com.flexpol.backend.model.Instrument;

/**
 * What a scenario run needs: the public brief, the server-only market seed (each simulated item
 * uses {@code seed + instrumentId}) and the star evaluation data, plus the debrief points the
 * coach brings out after a run. Never returned to the frontend as is; the evaluation only comes
 * back inside a run's result, and the debrief points only reach the coach's prompt after a run.
 */
public record ScenarioRunSpec(ScenarioResponse brief, long seed, Evaluation evaluation, List<String> debriefPoints) {

	static ScenarioRunSpec from(Scenario scenario) {
		var evaluation = new Evaluation(
				scenario.getSuitableInstruments().stream().map(Instrument::getId).toList(),
				scenario.getMinInstruments(),
				scenario.getShareRanges().stream().map(ShareRange::from).toList(),
				scenario.getEvaluationExplanation());
		return new ScenarioRunSpec(ScenarioResponse.from(scenario), scenario.getScenarioSeed(), evaluation,
				List.copyOf(scenario.getDebriefPoints()));
	}

	/** The "right assets" and "right shares" data from knowledge/sandbox-scenarios.json. */
	public record Evaluation(
			List<Long> suitableInstrumentIds,
			int minInstruments,
			List<ShareRange> shareRanges,
			String explanation) {
	}

	/** Shares are fractions of the budget; {@code each} applies the range to every instrument on its own. */
	public record ShareRange(
			String label,
			boolean includesCash,
			boolean each,
			List<Long> instrumentIds,
			BigDecimal min,
			BigDecimal max) {

		static ShareRange from(ScenarioShareRange range) {
			return new ShareRange(range.getLabel(), range.isIncludesCash(), range.isEachInstrument(),
					range.getInstruments().stream().map(Instrument::getId).toList(), range.getMinShare(),
					range.getMaxShare());
		}
	}
}
