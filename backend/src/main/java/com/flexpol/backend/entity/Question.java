package com.flexpol.backend.entity;

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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A single A-D question inside a quiz. */
@Entity
@Table(name = "question", uniqueConstraints = @UniqueConstraint(columnNames = { "quiz_id", "sort_order" }))
@Getter
@Setter
@NoArgsConstructor
public class Question {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "quiz_id", nullable = false)
	private Quiz quiz;

	@Column(nullable = false)
	private Integer sortOrder;

	@Column(nullable = false, length = 1000)
	private String prompt;

	/** Shown to the learner after answering. */
	@Column(length = 2000)
	private String explanation;

	/** For final-quiz questions: the subchapter to review. Null for control questions. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "source_subchapter_id")
	private Subchapter sourceSubchapter;

	@OneToMany(mappedBy = "question")
	@OrderBy("label ASC")
	private List<AnswerOption> options = new ArrayList<>();
}
