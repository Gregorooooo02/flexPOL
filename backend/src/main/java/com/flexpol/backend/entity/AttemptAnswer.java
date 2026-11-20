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

/** The option a user picked for one question during an attempt. */
@Entity
@Table(name = "attempt_answer", uniqueConstraints = @UniqueConstraint(columnNames = { "attempt_id", "question_id" }))
@Getter
@Setter
@NoArgsConstructor
public class AttemptAnswer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "attempt_id", nullable = false)
	private QuizAttempt attempt;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "question_id", nullable = false)
	private Question question;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "selected_option_id", nullable = false)
	private AnswerOption selectedOption;

	/** Stored at scoring time so results don't need recomputing. */
	@Column(nullable = false)
	private boolean correct;
}
