package com.flexpol.backend.dto;

import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.Question;

/**
 * The result of checking one answer. It reveals the correct option and the explanation,
 * so it is only sent in reply to an answer the learner has already given.
 */
public record AnswerResultResponse(
		Long questionId,
		Long selectedOptionId,
		boolean correct,
		Long correctOptionId,
		String explanation) {

	public static AnswerResultResponse from(Question question, AnswerOption selected, AnswerOption correctOption) {
		return new AnswerResultResponse(
				question.getId(),
				selected.getId(),
				selected.isCorrect(),
				correctOption.getId(),
				question.getExplanation());
	}
}
