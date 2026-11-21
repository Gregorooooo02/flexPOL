package com.flexpol.backend.service;

import com.flexpol.backend.dto.AnswerResultResponse;
import com.flexpol.backend.dto.AnswerSubmissionRequest;
import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.entity.User;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.QuestionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * Checks answers one question at a time, using the authored solution for that question.
 * With an attempt id the answer is also saved in the learner's quiz attempt ({@link QuizAttemptService}).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

	private final QuestionRepository questionRepository;
	private final QuizAttemptService quizAttemptService;
	private final UserService userService;

	@Transactional
	public AnswerResultResponse checkAnswer(Long questionId, AnswerSubmissionRequest request, String userEmail) {
		Question question = questionRepository.findById(questionId)
				.orElseThrow(() -> new ResourceNotFoundException("Question", questionId));
		if (question.getAssignment() != null) {
			if (request.optionId() != null) {
				throw new BadRequestException("This question accepts assignments instead of optionId");
			}
			boolean correct = AssignmentGrading.isCorrect(question.getAssignment(), request.assignments());
			if (request.attemptId() != null) {
				User user = userService.requireCurrentUser(userEmail);
				quizAttemptService.recordAnswer(request.attemptId(), user, question, null, request.assignments(), correct);
			}
			return AnswerResultResponse.forAssignment(question, correct);
		}
		Long optionId = request.optionId();
		if (optionId == null) {
			throw new BadRequestException("optionId is required");
		}
		if (request.assignments() != null) {
			throw new BadRequestException("This question accepts optionId instead of assignments");
		}
		AnswerOption selected = question.getOptions().stream()
				.filter(option -> option.getId().equals(optionId))
				.findFirst()
				.orElseThrow(() -> new ResourceNotFoundException("Answer option of question " + questionId, optionId));
		AnswerOption correctOption = question.getOptions().stream()
				.filter(AnswerOption::isCorrect)
				.findFirst()
				.orElseThrow(() -> new IllegalStateException("Question " + questionId + " has no correct option"));

		if (request.attemptId() != null) {
			User user = userService.requireCurrentUser(userEmail);
			quizAttemptService.recordAnswer(request.attemptId(), user, question, selected, null, selected.isCorrect());
		}
		return AnswerResultResponse.from(question, selected, correctOption);
	}
}
