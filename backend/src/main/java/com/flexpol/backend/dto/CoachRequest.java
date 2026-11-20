package com.flexpol.backend.dto;

/**
 * A learner's message to the AI coach. {@code subchapterId} is optional: when present, the coach
 * gets that lesson as context.
 */
public record CoachRequest(String message, Long subchapterId) {
}
