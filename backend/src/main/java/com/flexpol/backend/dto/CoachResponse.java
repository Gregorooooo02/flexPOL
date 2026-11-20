package com.flexpol.backend.dto;

/**
 * The coach's reply. {@code aiAvailable} is false when the reply is a fixed fallback message
 * because the AI model is not configured or could not be reached. Send {@code conversationId}
 * with the next message to continue the conversation.
 */
public record CoachResponse(String reply, boolean aiAvailable, String conversationId) {
}
