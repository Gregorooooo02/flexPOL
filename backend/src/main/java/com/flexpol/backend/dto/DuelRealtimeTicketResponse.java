package com.flexpol.backend.dto;

import java.time.Instant;

/** webSocketPath is relative to the configured API base URL. */
public record DuelRealtimeTicketResponse(String ticket, Instant expiresAt, String webSocketPath) {
}
