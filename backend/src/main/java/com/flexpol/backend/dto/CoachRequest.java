package com.flexpol.backend.dto;

/**
 * A learner's message to the AI coach. Both ids are optional: {@code subchapterId} gives the coach
 * that lesson as context, and {@code conversationId} (from an earlier {@link CoachResponse})
 * continues that conversation. Without it, a new conversation starts.
 */
public record CoachRequest(String message, Long subchapterId, String conversationId) {
}
