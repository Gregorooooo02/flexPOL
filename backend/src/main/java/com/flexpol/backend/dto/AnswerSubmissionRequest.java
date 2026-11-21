package com.flexpol.backend.dto;

import java.util.Map;

/**
 * Either a selected option or the learner's card-to-target assignments. With {@code attemptId} (from
 * {@code POST /api/quizzes/{quizId}/attempts}) the answer is also saved in that attempt;
 * this needs the attempt owner's {@code X-User-Email} header.
 */
public record AnswerSubmissionRequest(Long optionId, Long attemptId, Map<String, String> assignments) {
}
