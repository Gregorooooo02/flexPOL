package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * A learner's message to the AI coach. Everything except {@code message} is optional:
 * <ul>
 * <li>{@code subchapterId} gives the coach that lesson as context;</li>
 * <li>{@code questionId} tells it which quiz question the learner is on, and {@code selectedOptionId}
 * which option they checked (or {@code assignments} for matching and sorting, or {@code number});</li>
 * <li>{@code scenarioId} tells it which sandbox scenario the learner is in, {@code allocations} their plan
 * (as in {@link ScenarioRunRequest}: the rest stays cash), and {@code scenarioRun} whether they have run
 * that plan and see its result. The server runs the plan again for the coach, so results are never
 * taken from the client;</li>
 * <li>{@code conversationId} (from an earlier {@link CoachResponse}) continues that conversation.
 * Without it, a new conversation starts.</li>
 * </ul>
 */
public record CoachRequest(
		String message,
		Long subchapterId,
		Long questionId,
		Long selectedOptionId,
		String conversationId,
		Map<String, String> assignments,
		BigDecimal number,
		Long scenarioId,
		List<ScenarioRunRequest.Allocation> allocations,
		Boolean scenarioRun) {
}
