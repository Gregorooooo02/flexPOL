package com.flexpol.backend.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.flexpol.backend.entity.AssignmentExercise;
import com.flexpol.backend.entity.NumberExercise;
import com.flexpol.backend.entity.PortfolioComparison;
import com.flexpol.backend.entity.Question;

/**
 * A question as shown before answering. The explanation and the source subchapter
 * are left out because they would give the answer away; they belong in quiz results.
 */
public record QuestionResponse(
		Long id,
		Integer sortOrder,
		String prompt,
		List<AnswerOptionResponse> options,
		@JsonInclude(JsonInclude.Include.NON_NULL) AssignmentContent assignment,
		@JsonInclude(JsonInclude.Include.NON_NULL) PortfolioComparison comparison,
		@JsonInclude(JsonInclude.Include.NON_NULL) NumberContent numberExercise) {

	public record NumberContent(String label, String unit, NumberExercise.Lab lab, NumberExercise.Dial dial) {
		static NumberContent from(NumberExercise exercise) {
			return exercise == null ? null : new NumberContent(exercise.label(), exercise.unit(), exercise.lab(), exercise.dial());
		}
	}

	/** The cards and destinations can be sent before the learner makes any assignments. */
	public record AssignmentContent(
			AssignmentExercise.Mode mode,
			List<AssignmentExercise.Card> cards,
			List<AssignmentExercise.Target> targets) {

		static AssignmentContent from(AssignmentExercise assignment) {
			return assignment == null ? null
					: new AssignmentContent(assignment.mode(), assignment.cards(), assignment.targets());
		}
	}

	public static QuestionResponse from(Question question) {
		return new QuestionResponse(
				question.getId(),
				question.getSortOrder(),
				question.getPrompt(),
				question.getOptions().stream().map(AnswerOptionResponse::from).toList(),
				AssignmentContent.from(question.getAssignment()),
				question.getComparison(),
				NumberContent.from(question.getNumberExercise()));
	}
}
