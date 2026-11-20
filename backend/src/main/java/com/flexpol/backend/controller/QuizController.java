package com.flexpol.backend.controller;

import com.flexpol.backend.dto.QuizResponse;
import com.flexpol.backend.service.QuizService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

	private final QuizService quizService;

	@GetMapping("/{quizId}")
	public QuizResponse getQuiz(@PathVariable Long quizId) {
		return quizService.getQuiz(quizId);
	}
}
