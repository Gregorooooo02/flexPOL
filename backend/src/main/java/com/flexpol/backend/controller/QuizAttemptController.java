package com.flexpol.backend.controller;

import com.flexpol.backend.dto.QuizAttemptResponse;
import com.flexpol.backend.service.QuizAttemptService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/** Quiz attempts of the learner named by the {@code X-User-Email} header. */
@RestController
@RequiredArgsConstructor
public class QuizAttemptController {

	private final QuizAttemptService quizAttemptService;

	@PostMapping("/api/quizzes/{quizId}/attempts")
	@ResponseStatus(HttpStatus.CREATED)
	public QuizAttemptResponse start(
			@PathVariable Long quizId,
			@RequestHeader(name = UserHeader.NAME, required = false) String userEmail) {
		return quizAttemptService.start(quizId, userEmail);
	}

	@GetMapping("/api/quiz-attempts/{attemptId}")
	public QuizAttemptResponse get(
			@PathVariable Long attemptId,
			@RequestHeader(name = UserHeader.NAME, required = false) String userEmail) {
		return quizAttemptService.get(attemptId, userEmail);
	}
}
