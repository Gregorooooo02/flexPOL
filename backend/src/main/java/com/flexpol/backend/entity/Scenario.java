package com.flexpol.backend.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.flexpol.backend.model.Instrument;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A sandbox scenario from {@code knowledge/sandbox-scenarios.json}: a fictional person with a goal,
 * a budget, a horizon and the instruments they may use. The seed, the reference allocations, the
 * traps and the debrief points are for evaluating and explaining a submission, so they are never
 * sent to the frontend before the learner has submitted.
 */
@Entity
@Table(name = "scenario")
@Getter
@Setter
@NoArgsConstructor
public class Scenario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Stable key from the JSON, e.g. "marek-favourite-company". */
	@Column(nullable = false, unique = true, length = 80)
	private String slug;

	/** Display code such as "2.1". */
	@Column(nullable = false, unique = true, length = 10)
	private String code;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "chapter_id", nullable = false)
	private Chapter chapter;

	/** Position in the scenario list, across chapters. */
	@Column(nullable = false, unique = true)
	private Integer sortOrder;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false, length = 100)
	private String personaName;

	private Integer personaAge;

	@Column(length = 1000)
	private String personaSituation;

	@Column(nullable = false, length = 1000)
	private String goal;

	@Column(nullable = false, length = 3)
	private String currency;

	@Column(nullable = false, precision = 15, scale = 2)
	private BigDecimal budget;

	/** Calendar days; the end date is {@code startDate.plusDays(durationDays)}. */
	@Column(nullable = false)
	private Integer durationDays;

	/** Final value that fully meets the goal (growth score 100). */
	@Column(nullable = false, precision = 15, scale = 2)
	private BigDecimal target;

	/** Final value at which the growth score is 0. */
	@Column(nullable = false, precision = 15, scale = 2)
	private BigDecimal floor;

	/** Largest drop the person can live with, as a fraction (0.04 = 4%). */
	@Column(nullable = false, precision = 5, scale = 4)
	private BigDecimal maxDrawdown;

	@Column(nullable = false, precision = 3, scale = 2)
	private BigDecimal growthWeight;

	@Column(nullable = false, precision = 3, scale = 2)
	private BigDecimal stabilityWeight;

	/** Points lost for each broken advisory rule. */
	@Column(nullable = false)
	private Integer rulePenaltyPoints;

	/** Each simulated item uses {@code scenarioSeed + instrumentId}. Server-side only. */
	@Column(nullable = false)
	private Long scenarioSeed;

	/** Expected retirement income gap, only for the pension scenario. */
	@Column(precision = 15, scale = 2)
	private BigDecimal retirementGap;

	/** Lessons the scenario practises. */
	@ManyToMany
	@JoinTable(name = "scenario_lesson", joinColumns = @JoinColumn(name = "scenario_id"),
			inverseJoinColumns = @JoinColumn(name = "subchapter_id"))
	@OrderColumn(name = "sort_order")
	private List<Subchapter> lessons = new ArrayList<>();

	/** Catalogue instruments the learner may invest in; cash is always available as well. */
	@ManyToMany
	@JoinTable(name = "scenario_instrument", joinColumns = @JoinColumn(name = "scenario_id"),
			inverseJoinColumns = @JoinColumn(name = "instrument_id"))
	@OrderColumn(name = "sort_order")
	private List<Instrument> instruments = new ArrayList<>();

	@ElementCollection
	@CollectionTable(name = "scenario_money_need", joinColumns = @JoinColumn(name = "scenario_id"))
	@OrderColumn(name = "sort_order")
	private List<ScenarioMoneyNeed> moneyNeeds = new ArrayList<>();

	@OneToMany(mappedBy = "scenario")
	@OrderBy("sortOrder ASC")
	private List<ScenarioRule> rules = new ArrayList<>();

	/** Reference, also-acceptable and trap allocations. Server-side only. */
	@OneToMany(mappedBy = "scenario")
	@OrderBy("sortOrder ASC")
	private List<ScenarioAllocation> allocations = new ArrayList<>();

	/**
	 * Instruments that suit the person (the "right assets" star); cash is always fine. Server-side
	 * only until the learner has a result.
	 */
	@ManyToMany
	@JoinTable(name = "scenario_suitable_instrument", joinColumns = @JoinColumn(name = "scenario_id"),
			inverseJoinColumns = @JoinColumn(name = "instrument_id"))
	@OrderColumn(name = "sort_order")
	private List<Instrument> suitableInstruments = new ArrayList<>();

	/** How many different suitable instruments the "right assets" star needs (0 allows all cash). */
	@Column(nullable = false)
	private Integer minInstruments;

	/** Ranges for the "right shares" star. Server-side only until the learner has a result. */
	@OneToMany(mappedBy = "scenario")
	@OrderBy("sortOrder ASC")
	private List<ScenarioShareRange> shareRanges = new ArrayList<>();

	/** Why the suitable instruments and ranges fit the person; shown with the result. */
	@Column(nullable = false, length = 1000)
	private String evaluationExplanation;

	/** What the debrief should bring out. Server-side only until the learner has a result. */
	@ElementCollection
	@CollectionTable(name = "scenario_debrief_point", joinColumns = @JoinColumn(name = "scenario_id"))
	@OrderColumn(name = "sort_order")
	@Column(name = "point_text", nullable = false, length = 1000)
	private List<String> debriefPoints = new ArrayList<>();

	/** Parts of the real-life situation this sandbox doesn't model. */
	@ElementCollection
	@CollectionTable(name = "scenario_not_simulated", joinColumns = @JoinColumn(name = "scenario_id"))
	@OrderColumn(name = "sort_order")
	@Column(name = "note_text", nullable = false, length = 1000)
	private List<String> notSimulated = new ArrayList<>();
}
