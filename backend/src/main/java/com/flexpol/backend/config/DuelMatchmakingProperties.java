package com.flexpol.backend.config;

import java.net.URI;
import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("hedgeflex.duel.matchmaking")
public record DuelMatchmakingProperties(
		@DefaultValue("30s") Duration queueLease,
		@DefaultValue("10s") Duration heartbeatInterval,
		@DefaultValue("30s") Duration ticketLease,
		@DefaultValue({ "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080", "http://127.0.0.1:8080" }) List<String> allowedOrigins) {
	public DuelMatchmakingProperties {
		for (var duration : List.of(queueLease, heartbeatInterval, ticketLease)) {
			if (duration.isNegative() || duration.toMillis() == 0 || duration.compareTo(Duration.ofMinutes(5)) > 0) {
				throw new IllegalArgumentException("Duel presence/ticket durations must be positive and at most five minutes");
			}
		}
		if (heartbeatInterval.compareTo(queueLease) >= 0) throw new IllegalArgumentException("Heartbeat must be shorter than the queue lease");
		allowedOrigins = List.copyOf(allowedOrigins);
		if (allowedOrigins.isEmpty()) throw new IllegalArgumentException("At least one explicit WebSocket origin is required");
		for (var origin : allowedOrigins) {
			var uri = URI.create(origin);
			if (!("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) || uri.getHost() == null
					|| uri.getUserInfo() != null || uri.getRawQuery() != null || uri.getFragment() != null
					|| (uri.getPath() != null && !uri.getPath().isEmpty())) {
				throw new IllegalArgumentException("WebSocket origins must be explicit HTTP(S) origins without paths");
			}
		}
	}
}
