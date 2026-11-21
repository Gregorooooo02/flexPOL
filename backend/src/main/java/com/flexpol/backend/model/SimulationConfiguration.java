package com.flexpol.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "simulation_configuration")
@Getter
@Setter
@NoArgsConstructor
public class SimulationConfiguration {

	@Id
	@Column(name = "id")
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "instrument_id", nullable = false, unique = true)
	private Instrument instrument;

	@Column(name = "model_key", nullable = false, length = 64)
	private String modelKey;

	// text on PostgreSQL; @Lob would map to a large-object oid there
	@JdbcTypeCode(SqlTypes.LONG32VARCHAR)
	@Column(name = "parameters_json", nullable = false)
	private String parametersJson;
}
