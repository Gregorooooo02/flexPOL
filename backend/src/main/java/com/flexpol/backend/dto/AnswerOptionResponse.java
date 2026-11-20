package com.flexpol.backend.dto;

import com.flexpol.backend.entity.AnswerOption;

/** An answer option as shown to the learner. Deliberately leaves out whether it is correct. */
public record AnswerOptionResponse(Long id, String label, String text) {

	public static AnswerOptionResponse from(AnswerOption option) {
		return new AnswerOptionResponse(option.getId(), option.getLabel(), option.getText());
	}
}
