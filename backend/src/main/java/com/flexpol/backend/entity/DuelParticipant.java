package com.flexpol.backend.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "duel_participant", uniqueConstraints = {
		@UniqueConstraint(columnNames = { "match_id", "user_id" }),
		@UniqueConstraint(columnNames = { "match_id", "seat" })
}, indexes = @Index(columnList = "user_id"))
@Getter
@Setter
@NoArgsConstructor
public class DuelParticipant {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "match_id", nullable = false)
	private DuelMatch match;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false)
	private int seat;

	@Column(nullable = false)
	private long draftRevision;

	private Instant savedAt;
	private Instant submittedAt;

	@Enumerated(EnumType.STRING)
	@Column(length = 10)
	private DuelSubmissionSource submissionSource;

	@OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("instrumentId ASC")
	private List<DuelAllocation> allocations = new ArrayList<>();
}
