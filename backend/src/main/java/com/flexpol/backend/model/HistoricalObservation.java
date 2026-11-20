package com.flexpol.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "historical_observation", uniqueConstraints = {
		@UniqueConstraint(name = "uk_historical_observation_instrument_date",
				columnNames = { "instrument_id", "observation_date" })
})
@Getter
@Setter
@NoArgsConstructor
public class HistoricalObservation {

	@Id
	@Column(name = "id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "instrument_id", nullable = false)
	private Instrument instrument;

	@Column(name = "observation_date", nullable = false)
	private LocalDate date;

	@Column(name = "original_date", nullable = false)
	private LocalDate originalDate;

	@Column(name = "observation_value", nullable = false, precision = 24, scale = 8)
	private BigDecimal value;
}
