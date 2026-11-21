package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.flexpol.backend.model.DuelScenarioSpec;
import com.flexpol.backend.model.enums.AssetClass;
import com.flexpol.backend.model.enums.RiskLevel;

/** Public briefing only. Match seeds and market specifications must stay in separate server-only data. */
public record DuelScenarioResponse(
		int schemaVersion,
		String templateId,
		int templateVersion,
		String title,
		String background,
		String objective,
		String currency,
		BigDecimal budget,
		int durationDays,
		AssetClass category,
		String categoryLabel,
		List<AllowedInstrument> instruments,
		List<String> rules,
		String disclaimer) {

	public DuelScenarioResponse {
		instruments = List.copyOf(instruments);
		rules = List.copyOf(rules);
	}

	public static DuelScenarioResponse from(DuelScenarioSpec spec) {
		return new DuelScenarioResponse(spec.schemaVersion(), spec.templateId(), spec.templateVersion(),
				spec.title(), spec.background(), spec.objective(), spec.currency(), spec.budget(), spec.durationDays(),
				spec.category(), spec.categoryLabel(), spec.instruments().stream()
						.map(instrument -> new AllowedInstrument(instrument.id(), instrument.name(), instrument.description(),
								instrument.assetClass(), instrument.currency(), instrument.riskLevel()))
						.toList(), spec.rules(), spec.disclaimer());
	}

	public record AllowedInstrument(
			Long id, String name, String description, AssetClass assetClass, String currency, RiskLevel riskLevel) {
	}
}
