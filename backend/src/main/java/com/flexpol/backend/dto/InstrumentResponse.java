package com.flexpol.backend.dto;

import com.flexpol.backend.model.SimulationConfigurationResponse;
import com.flexpol.backend.model.enums.AssetClass;
import com.flexpol.backend.model.enums.HistoryValueType;
import com.flexpol.backend.model.enums.RiskLevel;

/** Catalog metadata and assumptions, without embedding historical observations. */
public record InstrumentResponse(
		Long id,
		String name,
		String description,
		AssetClass assetClass,
		String currency,
		RiskLevel riskLevel,
		HistoryValueType historyValueType,
		String historySource,
		String historyDescription,
		boolean historyRebased,
		SimulationConfigurationResponse simulationConfiguration) {
}
