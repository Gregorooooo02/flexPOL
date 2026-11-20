package com.flexpol.backend.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A set of A-D questions: either the control questions of a subchapter
 * ({@link QuizType#CONTROL}) or the final quiz of a chapter ({@link QuizType#FINAL}).
 */
@Entity
@Table(name = "quiz")
@Getter
@Setter
@NoArgsConstructor
public class Quiz {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "chapter_id", nullable = false)
	private Chapter chapter;

	/** Set for control quizzes, null for final quizzes. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "subchapter_id", unique = true)
	private Subchapter subchapter;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private QuizType quizType;

	@Column(nullable = false)
	private String title;

	/** Minimum number of correct answers to pass, if the quiz has one. */
	private Integer passMark;

	@OneToMany(mappedBy = "quiz")
	@OrderBy("sortOrder ASC")
	private List<Question> questions = new ArrayList<>();
}
