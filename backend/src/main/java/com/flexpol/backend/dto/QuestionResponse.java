package com.flexpol.backend.dto;

import java.util.List;

import com.flexpol.backend.entity.Question;

/**
 * A question as shown before answering. The explanation and the source subchapter
 * are left out because they would give the answer away; they belong in quiz results.
 */
public record QuestionResponse(Long id, Integer sortOrder, String prompt, List<AnswerOptionResponse> options) {

	public static QuestionResponse from(Question question) {
		return new QuestionResponse(
				question.getId(),
				question.getSortOrder(),
				question.getPrompt(),
				question.getOptions().stream().map(AnswerOptionResponse::from).toList());
	}
}
