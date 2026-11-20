package com.flexpol.backend.model;

import com.flexpol.backend.model.enums.AssetClass;
import com.flexpol.backend.model.enums.HistoryValueType;
import com.flexpol.backend.model.enums.RiskLevel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "instrument")
@Getter
@Setter
@NoArgsConstructor
public class Instrument {

	@Id
	@Column(name = "id")
	private Long id;

	@Column(name = "name", nullable = false, length = 255)
	private String name;

	@Column(name = "description", length = 2000)
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(name = "asset_class", nullable = false, length = 64)
	private AssetClass assetClass;

	@Column(name = "currency", nullable = false, length = 3)
	private String currency;

	@Enumerated(EnumType.STRING)
	@Column(name = "risk_level", nullable = false, length = 32)
	private RiskLevel riskLevel;

	@Enumerated(EnumType.STRING)
	@Column(name = "history_value_type", nullable = false, length = 64)
	private HistoryValueType historyValueType;

	@Column(name = "history_source", nullable = false, length = 255)
	private String historySource;

	@Column(name = "history_description", length = 2000)
	private String historyDescription;

	@Column(name = "history_rebased", nullable = false)
	private boolean historyRebased;
}
