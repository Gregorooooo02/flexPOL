package com.flexpol.backend.dto;

import com.flexpol.backend.entity.Subchapter;

/** A full subchapter, including the lesson body as Markdown. */
public record SubchapterResponse(
		Long id,
		Long chapterId,
		String code,
		Integer sortOrder,
		String title,
		String goal,
		String sandboxInstrument,
		String lessonMarkdown,
		Long controlQuizId) {

	public static SubchapterResponse from(Subchapter subchapter, Long controlQuizId) {
		return new SubchapterResponse(
				subchapter.getId(),
				subchapter.getChapter().getId(),
				subchapter.getCode(),
				subchapter.getSortOrder(),
				subchapter.getTitle(),
				subchapter.getGoal(),
				subchapter.getSandboxInstrument(),
				subchapter.getLessonMarkdown(),
				controlQuizId);
	}
}
