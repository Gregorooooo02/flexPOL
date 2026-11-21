package com.flexpol.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.Question;

/**
 * The result of checking one answer. A wrong assignment gets a hint so the learner can retry.
 */
public record AnswerResultResponse(
		Long questionId,
		Long selectedOptionId,
		boolean correct,
		Long correctOptionId,
		String explanation,
		@JsonInclude(JsonInclude.Include.NON_NULL) String hint) {

	public static AnswerResultResponse from(Question question, AnswerOption selected, AnswerOption correctOption) {
		return new AnswerResultResponse(
				question.getId(),
				selected.getId(),
				selected.isCorrect(),
				correctOption.getId(),
				question.getExplanation(),
				null);
	}

	public static AnswerResultResponse forAssignment(Question question, boolean correct) {
		return new AnswerResultResponse(question.getId(), null, correct, null,
				correct ? question.getExplanation() : null,
				correct ? null : question.getAssignment().hint());
	}
}
