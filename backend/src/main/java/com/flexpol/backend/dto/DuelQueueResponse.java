package com.flexpol.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record DuelQueueResponse(State state, UUID entryId, Instant joinedAt, Instant leaseExpiresAt,
		UUID matchId, long heartbeatIntervalMs, Instant serverNow) {
	public enum State { IDLE, WAITING, MATCHING, MATCHED }
}
