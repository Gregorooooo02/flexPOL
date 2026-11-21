package com.flexpol.backend.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("hedgeflex.duel")
public record DuelProperties(
		@DefaultValue("8s") Duration briefingDuration,
		@DefaultValue("120s") Duration planningDuration,
		@DefaultValue("30s") Duration evaluationLease,
		@DefaultValue("3") int evaluationMaxAttempts) {

	public DuelProperties {
		validate(briefingDuration, "briefing-duration");
		validate(planningDuration, "planning-duration");
		validate(evaluationLease, "evaluation-lease");
		if (evaluationMaxAttempts < 1 || evaluationMaxAttempts > 5) {
			throw new IllegalArgumentException("hedgeflex.duel.evaluation-max-attempts must be between 1 and 5");
		}
	}

	private static void validate(Duration duration, String name) {
		if (duration == null || duration.isNegative() || duration.isZero() || duration.compareTo(Duration.ofDays(1)) > 0) {
			throw new IllegalArgumentException("hedgeflex.duel." + name + " must be positive and no longer than one day");
		}
	}
}
