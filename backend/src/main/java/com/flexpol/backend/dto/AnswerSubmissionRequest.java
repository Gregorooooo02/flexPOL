package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.util.Map;

/**
 * A selected option, card-to-target assignments or a numeric value. With {@code attemptId} (from
 * {@code POST /api/quizzes/{quizId}/attempts}) the answer is also saved in that attempt;
 * this needs the attempt owner's {@code X-User-Email} header.
 */
public record AnswerSubmissionRequest(Long optionId, Long attemptId, Map<String, String> assignments, BigDecimal number) {
}
