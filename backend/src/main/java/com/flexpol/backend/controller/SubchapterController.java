package com.flexpol.backend.controller;

import com.flexpol.backend.dto.QuizResponse;
import com.flexpol.backend.dto.SubchapterResponse;
import com.flexpol.backend.service.QuizService;
import com.flexpol.backend.service.SubchapterService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/subchapters")
@RequiredArgsConstructor
public class SubchapterController {

	private final SubchapterService subchapterService;
	private final QuizService quizService;

	@GetMapping("/{subchapterId}")
	public SubchapterResponse getSubchapter(@PathVariable Long subchapterId) {
		return subchapterService.getSubchapter(subchapterId);
	}

	@GetMapping("/{subchapterId}/control-quiz")
	public QuizResponse getControlQuiz(@PathVariable Long subchapterId) {
		return quizService.getControlQuiz(subchapterId);
	}
}
