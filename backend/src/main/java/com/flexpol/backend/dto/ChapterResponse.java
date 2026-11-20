package com.flexpol.backend.dto;

import java.util.List;

import com.flexpol.backend.entity.Chapter;

public record ChapterResponse(
		Long id,
		Integer sortOrder,
		String title,
		String objective,
		String missionTitle,
		String missionDescription,
		Long finalQuizId,
		List<SubchapterSummaryResponse> subchapters) {

	public static ChapterResponse from(Chapter chapter, Long finalQuizId) {
		return new ChapterResponse(
				chapter.getId(),
				chapter.getSortOrder(),
				chapter.getTitle(),
				chapter.getObjective(),
				chapter.getMissionTitle(),
				chapter.getMissionDescription(),
				finalQuizId,
				chapter.getSubchapters().stream().map(SubchapterSummaryResponse::from).toList());
	}
}
