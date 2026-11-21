package com.flexpol.backend.dto;

import java.time.Instant;
import java.util.UUID;

/** Invalidation hints only. PONG belongs to transport liveness, not application navigation. */
public record DuelNotification(Type type, UUID matchId, Long revision, UUID entryId, Instant serverNow) {
	public enum Type { QUEUE_CHANGED, MATCH_FOUND, MATCH_CHANGED, RATING_CHANGED, PONG }
}
