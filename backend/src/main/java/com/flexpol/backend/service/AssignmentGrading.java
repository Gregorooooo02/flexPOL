package com.flexpol.backend.service;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.flexpol.backend.entity.AssignmentExercise;
import com.flexpol.backend.exception.BadRequestException;

final class AssignmentGrading {

	private AssignmentGrading() {}

	static boolean isCorrect(AssignmentExercise exercise, Map<String, String> assignments) {
		if (assignments == null || !assignments.keySet().equals(exercise.solution().keySet())) {
			throw new BadRequestException("Assign every card exactly once");
		}
		Set<String> targets = exercise.targets().stream().map(AssignmentExercise.Target::id)
				.collect(Collectors.toSet());
		if (!targets.containsAll(assignments.values())) {
			throw new BadRequestException("Use only destinations from this question");
		}
		if (exercise.mode() == AssignmentExercise.Mode.MATCH
				&& new HashSet<>(assignments.values()).size() != assignments.size()) {
			throw new BadRequestException("Use each destination at most once in a matching question");
		}
		return exercise.solution().equals(assignments);
	}
}
