package com.flexpol.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Money the person has to pay during a scenario, on the first simulated point on or after {@code day}. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class ScenarioMoneyNeed {

	/** Days after the start; DAY is a reserved word in H2. */
	@Column(name = "day_offset", nullable = false)
	private Integer day;

	@Column(nullable = false, precision = 15, scale = 2)
	private BigDecimal amount;

	@Column(nullable = false)
	private String label;
}
