package com.flexpol.backend.dto;

/**
 * The coach's reply. {@code aiAvailable} is false when the reply is a fixed fallback message
 * because the AI model is not configured or could not be reached.
 */
public record CoachResponse(String reply, boolean aiAvailable) {
}
