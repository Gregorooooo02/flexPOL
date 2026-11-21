package com.flexpol.backend.service;

import com.flexpol.backend.dto.ScenarioResponse;

/**
 * What a scenario run needs: the public brief plus the server-only market seed. Never returned to
 * the frontend; each simulated item uses {@code seed + instrumentId}.
 */
public record ScenarioRunSpec(ScenarioResponse brief, long seed) {
}
