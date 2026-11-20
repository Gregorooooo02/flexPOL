package com.flexpol.backend.service;

import com.flexpol.backend.dto.AnswerResultResponse;
import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.QuestionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * Checks answers one question at a time. This is the only place that reads
 * {@code answer_option.is_correct}, and only after the learner has picked an option.
 * Nothing is saved yet: attempts are not recorded.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

	private final QuestionRepository questionRepository;

	public AnswerResultResponse checkAnswer(Long questionId, Long optionId) {
		if (optionId == null) {
			throw new BadRequestException("optionId is required");
		}
		Question question = questionRepository.findById(questionId)
				.orElseThrow(() -> new ResourceNotFoundException("Question", questionId));
		AnswerOption selected = question.getOptions().stream()
				.filter(option -> option.getId().equals(optionId))
				.findFirst()
				.orElseThrow(() -> new ResourceNotFoundException("Answer option of question " + questionId, optionId));
		AnswerOption correctOption = question.getOptions().stream()
				.filter(AnswerOption::isCorrect)
				.findFirst()
				.orElseThrow(() -> new IllegalStateException("Question " + questionId + " has no correct option"));
		return AnswerResultResponse.from(question, selected, correctOption);
	}
}
