package com.flexpol.backend.controller;

import com.flexpol.backend.dto.AnswerResultResponse;
import com.flexpol.backend.dto.AnswerSubmissionRequest;
import com.flexpol.backend.service.QuestionService;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

	private final QuestionService questionService;

	@PostMapping("/{questionId}/answer")
	public AnswerResultResponse answer(@PathVariable Long questionId, @RequestBody AnswerSubmissionRequest request) {
		return questionService.checkAnswer(questionId, request.optionId());
	}
}
