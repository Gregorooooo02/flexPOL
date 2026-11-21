package com.flexpol.backend.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.flexpol.backend.model.Instrument;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** An advisory rule of a scenario, shown as a checklist item; each broken rule costs points. */
@Entity
@Table(name = "scenario_rule", uniqueConstraints = @UniqueConstraint(columnNames = { "scenario_id", "sort_order" }))
@Getter
@Setter
@NoArgsConstructor
public class ScenarioRule {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "scenario_id", nullable = false)
	private Scenario scenario;

	@Column(nullable = false)
	private Integer sortOrder;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private ScenarioRuleType ruleType;

	/** Largest allowed share of the budget, as a fraction. */
	@Column(nullable = false, precision = 5, scale = 4)
	private BigDecimal maxShare;

	@Column(nullable = false)
	private String label;

	/** Instruments the rule applies to. */
	@ManyToMany
	@JoinTable(name = "scenario_rule_instrument", joinColumns = @JoinColumn(name = "rule_id"),
			inverseJoinColumns = @JoinColumn(name = "instrument_id"))
	@OrderColumn(name = "sort_order")
	private List<Instrument> instruments = new ArrayList<>();
}
