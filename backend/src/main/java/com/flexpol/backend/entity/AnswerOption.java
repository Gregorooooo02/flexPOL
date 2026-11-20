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

/**
 * One of the four options (A-D) of a question. {@code correct} must never be
 * sent to the frontend before the learner has answered.
 */
@Entity
@Table(name = "answer_option", uniqueConstraints = @UniqueConstraint(columnNames = { "question_id", "label" }))
@Getter
@Setter
@NoArgsConstructor
public class AnswerOption {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "question_id", nullable = false)
	private Question question;

	/** "A", "B", "C" or "D". */
	@Column(nullable = false, length = 1)
	private String label;

	@Column(nullable = false, length = 1000)
	private String text;

	@Column(name = "is_correct", nullable = false)
	private boolean correct;
}
