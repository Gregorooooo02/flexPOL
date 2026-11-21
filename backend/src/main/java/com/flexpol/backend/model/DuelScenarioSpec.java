package com.flexpol.backend.model;

import java.math.BigDecimal;
import java.util.List;

import com.flexpol.backend.model.enums.AssetClass;
import com.flexpol.backend.model.enums.RiskLevel;

/** Resolved once per match and ready to be persisted, not regenerated per player or request. */
public record DuelScenarioSpec(
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

	public DuelScenarioSpec {
		instruments = List.copyOf(instruments);
		rules = List.copyOf(rules);
	}

	/** Display metadata is snapshotted without exposing simulation parameters or seeds. */
	public record AllowedInstrument(
			Long id, String name, String description, AssetClass assetClass, String currency, RiskLevel riskLevel) {
	}
}
