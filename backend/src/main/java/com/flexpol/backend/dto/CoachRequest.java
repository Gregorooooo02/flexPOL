package com.flexpol.backend.dto;

/**
 * A learner's message to the AI coach. Everything except {@code message} is optional:
 * <ul>
 * <li>{@code subchapterId} gives the coach that lesson as context;</li>
 * <li>{@code questionId} tells it which quiz question the learner is on, and {@code selectedOptionId}
 * which option they picked and had checked (leave it out before they answer);</li>
 * <li>{@code conversationId} (from an earlier {@link CoachResponse}) continues that conversation.
 * Without it, a new conversation starts.</li>
 * </ul>
 */
public record CoachRequest(
		String message,
		Long subchapterId,
		Long questionId,
		Long selectedOptionId,
		String conversationId) {
}
