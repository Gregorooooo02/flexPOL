package com.flexpol.backend.entity;

import java.util.List;
import java.util.Map;

/** Authored cards, destinations and private grading data for a practice question. */
public record AssignmentExercise(
		Mode mode, List<Card> cards, List<Target> targets, Map<String, String> solution, String hint) {

	public enum Mode { MATCH, SORT }

	/** Price examples, when present, are displayed on a common scale. */
	public record Card(String id, String text, List<Integer> prices) {}

	public record Target(String id, String text) {}
}
