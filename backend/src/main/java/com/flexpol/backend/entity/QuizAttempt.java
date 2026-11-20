package com.flexpol.backend.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One attempt by a user at a quiz. Scored on the server. */
@Entity
@Table(name = "quiz_attempt")
@Getter
@Setter
@NoArgsConstructor
public class QuizAttempt {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "quiz_id", nullable = false)
	private Quiz quiz;

	@Column(nullable = false)
	private Instant startedAt;

	/** Null while the attempt is still in progress. */
	private Instant completedAt;

	/** Number of correct answers. */
	private Integer score;

	private Boolean passed;

	@OneToMany(mappedBy = "attempt")
	private List<AttemptAnswer> answers = new ArrayList<>();
}
