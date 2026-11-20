package com.flexpol.backend.dto;

import java.time.Instant;

import com.flexpol.backend.entity.QuizAttempt;

/**
 * A learner's attempt at a quiz. {@code completedAt}, {@code score} and {@code passed} stay null
 * until every question has been answered. The score counts each question's first answer only.
 */
public record QuizAttemptResponse(
		Long id,
		Long quizId,
		Instant startedAt,
		Instant completedAt,
		int answeredCount,
		int questionCount,
		Integer score,
		Boolean passed) {

	public static QuizAttemptResponse from(QuizAttempt attempt) {
		return new QuizAttemptResponse(
				attempt.getId(),
				attempt.getQuiz().getId(),
				attempt.getStartedAt(),
				attempt.getCompletedAt(),
				attempt.getAnswers().size(),
				attempt.getQuiz().getQuestions().size(),
				attempt.getScore(),
				attempt.getPassed());
	}
}
