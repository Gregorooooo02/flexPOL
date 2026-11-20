package com.flexpol.backend.service;

import java.util.List;

import com.flexpol.backend.dto.ChapterResponse;
import com.flexpol.backend.dto.SubchapterSummaryResponse;
import com.flexpol.backend.entity.Chapter;
import com.flexpol.backend.entity.Quiz;
import com.flexpol.backend.entity.QuizType;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.ChapterRepository;
import com.flexpol.backend.repository.QuizRepository;
import com.flexpol.backend.repository.SubchapterRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChapterService {

	private final ChapterRepository chapterRepository;
	private final SubchapterRepository subchapterRepository;
	private final QuizRepository quizRepository;

	public List<ChapterResponse> getChapters() {
		return chapterRepository.findAllByOrderBySortOrderAsc().stream()
				.map(chapter -> ChapterResponse.from(chapter, finalQuizId(chapter)))
				.toList();
	}

	public ChapterResponse getChapter(Long chapterId) {
		Chapter chapter = findChapter(chapterId);
		return ChapterResponse.from(chapter, finalQuizId(chapter));
	}

	public List<SubchapterSummaryResponse> getSubchapters(Long chapterId) {
		findChapter(chapterId);
		return subchapterRepository.findByChapterIdOrderBySortOrderAsc(chapterId).stream()
				.map(SubchapterSummaryResponse::from)
				.toList();
	}

	private Chapter findChapter(Long chapterId) {
		return chapterRepository.findById(chapterId)
				.orElseThrow(() -> new ResourceNotFoundException("Chapter", chapterId));
	}

	private Long finalQuizId(Chapter chapter) {
		return quizRepository.findByChapterIdAndQuizType(chapter.getId(), QuizType.FINAL)
				.map(Quiz::getId)
				.orElse(null);
	}
}
