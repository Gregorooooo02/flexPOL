package com.flexpol.backend.controller;

import java.util.List;

import com.flexpol.backend.dto.ChapterResponse;
import com.flexpol.backend.dto.QuizResponse;
import com.flexpol.backend.dto.SubchapterSummaryResponse;
import com.flexpol.backend.service.ChapterService;
import com.flexpol.backend.service.QuizService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chapters")
@RequiredArgsConstructor
public class ChapterController {

	private final ChapterService chapterService;
	private final QuizService quizService;

	@GetMapping
	public List<ChapterResponse> getChapters() {
		return chapterService.getChapters();
	}

	@GetMapping("/{chapterId}")
	public ChapterResponse getChapter(@PathVariable Long chapterId) {
		return chapterService.getChapter(chapterId);
	}

	@GetMapping("/{chapterId}/subchapters")
	public List<SubchapterSummaryResponse> getSubchapters(@PathVariable Long chapterId) {
		return chapterService.getSubchapters(chapterId);
	}

	@GetMapping("/{chapterId}/final-quiz")
	public QuizResponse getFinalQuiz(@PathVariable Long chapterId) {
		return quizService.getFinalQuiz(chapterId);
	}
}
