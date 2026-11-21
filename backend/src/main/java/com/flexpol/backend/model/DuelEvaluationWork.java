package com.flexpol.backend.model;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Detached immutable job input; constructing it finishes before any simulation begins. */
public record DuelEvaluationWork(UUID matchId, UUID claimToken, DuelScenarioSpec scenario,
		DuelMarketSpec market, List<Player> players) {
	public DuelEvaluationWork {
		players = List.copyOf(players);
	}

	public record Player(Long userId, String username, int seat, List<Allocation> allocations) {
		public Player {
			allocations = List.copyOf(allocations);
		}
	}

	public record Allocation(Long instrumentId, BigDecimal amount) {
	}
}
