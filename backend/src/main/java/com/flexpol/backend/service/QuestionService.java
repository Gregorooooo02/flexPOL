package com.flexpol.backend.service;

import java.math.BigDecimal;

import com.flexpol.backend.dto.AnswerResultResponse;
import com.flexpol.backend.dto.AnswerSubmissionRequest;
import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.AttemptAnswer;
import com.flexpol.backend.entity.NumberExercise;
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
	private static final BigDecimal NUMBER_LIMIT = BigDecimal.valueOf(1_000_000_000);

	private final QuestionRepository questionRepository;
	private final QuizAttemptService quizAttemptService;
	private final UserService userService;

	@Transactional
	public AnswerResultResponse checkAnswer(Long questionId, AnswerSubmissionRequest request, String userEmail) {
		Question question = questionRepository.findById(questionId)
				.orElseThrow(() -> new ResourceNotFoundException("Question", questionId));
		AttemptAnswer answer = new AttemptAnswer();
		answer.setQuestion(question);
		AnswerResultResponse result = grade(question, request, answer);
		if (request.attemptId() != null) {
			User user = userService.requireCurrentUser(userEmail);
			answer.setCorrect(result.correct());
			quizAttemptService.recordAnswer(request.attemptId(), user, answer);
		}
		return result;
	}

	private static AnswerResultResponse grade(Question question, AnswerSubmissionRequest request, AttemptAnswer answer) {
		if (question.getAssignment() != null) {
			if (request.optionId() != null || request.number() != null) {
				throw new BadRequestException("This question accepts assignments only");
			}
			boolean correct = AssignmentGrading.isCorrect(question.getAssignment(), request.assignments());
			answer.setAssignments(request.assignments());
			return AnswerResultResponse.forExercise(question, correct, question.getAssignment().hint());
		}
		if (question.getNumberExercise() != null) {
			if (request.optionId() != null || request.assignments() != null) {
				throw new BadRequestException("This question accepts a number only");
			}
			boolean correct = checkNumber(question.getNumberExercise(), request.number());
			answer.setNumericValue(request.number().stripTrailingZeros());
			return AnswerResultResponse.forExercise(question, correct, question.getNumberExercise().hint());
		}
		Long optionId = request.optionId();
		if (optionId == null) {
			throw new BadRequestException("optionId is required");
		}
		if (request.assignments() != null || request.number() != null) {
			throw new BadRequestException("This question accepts optionId only");
		}
		AnswerOption selected = question.getOptions().stream()
				.filter(option -> option.getId().equals(optionId))
				.findFirst()
				.orElseThrow(() -> new ResourceNotFoundException("Answer option of question " + question.getId(), optionId));
		AnswerOption correctOption = question.getOptions().stream()
				.filter(AnswerOption::isCorrect)
				.findFirst()
				.orElseThrow(() -> new IllegalStateException("Question " + question.getId() + " has no correct option"));

		answer.setSelectedOption(selected);
		return AnswerResultResponse.from(question, selected, correctOption);
	}

	static boolean checkNumber(NumberExercise exercise, BigDecimal value) {
		if (value == null || value.abs().compareTo(NUMBER_LIMIT) > 0 || value.stripTrailingZeros().scale() > 6) {
			throw new BadRequestException("Enter a number with at most six decimal places");
		}
		return exercise.answer().compareTo(value) == 0;
	}
}
