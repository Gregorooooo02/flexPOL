package com.flexpol.backend.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.flexpol.backend.model.Instrument;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/**
 * One range of the "right shares" star: the share of the budget in its instruments (plus cash when
 * {@code includesCash}) must lie between {@code minShare} and {@code maxShare}, inclusive. With
 * {@code eachInstrument}, every listed instrument's own share must lie in the range instead.
 * Server-side only until the learner has a result, like the reference allocations.
 */
@Entity
@Table(name = "scenario_share_range", uniqueConstraints = @UniqueConstraint(columnNames = { "scenario_id", "sort_order" }))
@Getter
@Setter
@NoArgsConstructor
public class ScenarioShareRange {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "scenario_id", nullable = false)
	private Scenario scenario;

	@Column(nullable = false)
	private Integer sortOrder;

	@Column(nullable = false)
	private String label;

	@Column(nullable = false)
	private boolean includesCash;

	@Column(nullable = false)
	private boolean eachInstrument;

	/** Fractions of the budget, e.g. 0.7 = 70%. */
	@Column(nullable = false, precision = 5, scale = 4)
	private BigDecimal minShare;

	@Column(nullable = false, precision = 5, scale = 4)
	private BigDecimal maxShare;

	@ManyToMany
	@JoinTable(name = "scenario_share_range_instrument", joinColumns = @JoinColumn(name = "share_range_id"),
			inverseJoinColumns = @JoinColumn(name = "instrument_id"))
	@OrderColumn(name = "sort_order")
	private List<Instrument> instruments = new ArrayList<>();
}
