package com.flexpol.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Append-only settlement audit, including zero changes for a draw or the zero-point floor. */
@Entity
@Table(name = "duel_rating_change", uniqueConstraints = @UniqueConstraint(columnNames = { "match_id", "user_id" }))
@Getter
@Setter
@NoArgsConstructor
public class DuelRatingChange {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "match_id", nullable = false)
	private DuelMatch match;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private DuelRating rating;

	@Column(nullable = false, length = 50)
	private String username;
	@Column(nullable = false)
	private int seat;
	@Column(nullable = false)
	private long pointsBefore;
	@Column(nullable = false)
	private long delta;
	@Column(nullable = false)
	private long pointsAfter;
}
