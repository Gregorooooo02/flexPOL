package com.flexpol.backend.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "duel_match", indexes = @Index(columnList = "phase, planning_ends_at"))
@Getter
@Setter
@NoArgsConstructor
public class DuelMatch {

	@Id
	private UUID id;

	@Version
	private Long persistenceVersion;

	/** Public change counter; includes allocation/submission changes on child rows. */
	@Column(nullable = false)
	private long revision = 1;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private DuelPhase phase = DuelPhase.BRIEFING;

	@Lob
	@Column(nullable = false)
	private String scenarioJson;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant planningStartsAt;

	@Column(nullable = false)
	private Instant planningEndsAt;

	private Instant evaluationStartedAt;
	private Instant cancelledAt;

	@Enumerated(EnumType.STRING)
	@Column(length = 30)
	private DuelCancellationReason cancellationReason;

	@OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("seat ASC")
	private List<DuelParticipant> participants = new ArrayList<>();
}
