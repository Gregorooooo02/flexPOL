package com.flexpol.backend.dto;

/**
 * The option the learner picked for one question. With {@code attemptId} (from
 * {@code POST /api/quizzes/{quizId}/attempts}) the answer is also saved in that attempt;
 * this needs the attempt owner's {@code X-User-Email} header.
 */
public record AnswerSubmissionRequest(Long optionId, Long attemptId) {
}
