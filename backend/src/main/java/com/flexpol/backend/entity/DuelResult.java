package com.flexpol.backend.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One immutable payload per match; match_id is both the foreign key and primary key. */
@Entity
@Table(name = "duel_result")
@Getter
@Setter
@NoArgsConstructor
public class DuelResult {
	@Id
	private UUID matchId;

	@MapsId
	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "match_id", nullable = false)
	private DuelMatch match;

	@Version
	private Long persistenceVersion;

	@Lob
	@Column(nullable = false)
	private String resultJson;
}
