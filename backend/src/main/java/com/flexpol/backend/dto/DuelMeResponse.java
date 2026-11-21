package com.flexpol.backend.dto;

import java.time.Instant;
import java.util.UUID;

/** Recovery references are hints; load the match for its authoritative current phase. */
public record DuelMeResponse(DuelRatingResponse rating, UUID activeMatchId, UUID latestTerminalMatchId, Instant serverNow) {
}
