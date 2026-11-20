package com.flexpol.backend.dto;

import java.util.List;

import com.flexpol.backend.entity.Quiz;
import com.flexpol.backend.entity.QuizType;

public record QuizResponse(
		Long id,
		QuizType quizType,
		String title,
		Long chapterId,
		Long subchapterId,
		Integer passMark,
		List<QuestionResponse> questions) {

	public static QuizResponse from(Quiz quiz) {
		return new QuizResponse(
				quiz.getId(),
				quiz.getQuizType(),
				quiz.getTitle(),
				quiz.getChapter().getId(),
				quiz.getSubchapter() == null ? null : quiz.getSubchapter().getId(),
				quiz.getPassMark(),
				quiz.getQuestions().stream().map(QuestionResponse::from).toList());
	}
}
