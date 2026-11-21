package com.flexpol.backend.entity;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import com.flexpol.backend.model.Instrument;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapKeyJoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A worked allocation of a scenario's budget: the reference answer, another acceptable answer, or a
 * trap with the reason it fails. Used for checking and explaining results; never sent to the
 * frontend before the learner has submitted.
 */
@Entity
@Table(name = "scenario_allocation", uniqueConstraints = @UniqueConstraint(columnNames = { "scenario_id", "sort_order" }))
@Getter
@Setter
@NoArgsConstructor
public class ScenarioAllocation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "scenario_id", nullable = false)
	private Scenario scenario;

	@Column(nullable = false)
	private Integer sortOrder;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ScenarioAllocationKind kind;

	/** Trap name such as "All in"; empty for reference and acceptable allocations. */
	private String label;

	/** Why a trap doesn't fit the goal. */
	@Column(length = 1000)
	private String why;

	/** Share of the budget kept as cash, as a fraction. */
	@Column(nullable = false, precision = 5, scale = 4)
	private BigDecimal cashShare;

	/** Share of the budget per instrument, as fractions; together with cash they add up to 1. */
	@ElementCollection
	@CollectionTable(name = "scenario_allocation_share", joinColumns = @JoinColumn(name = "allocation_id"))
	@MapKeyJoinColumn(name = "instrument_id")
	@Column(name = "share", nullable = false, precision = 5, scale = 4)
	private Map<Instrument, BigDecimal> instrumentShares = new HashMap<>();
}
