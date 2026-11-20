package com.flexpol.backend.service;

import com.flexpol.backend.dto.QuizResponse;
import com.flexpol.backend.entity.QuizType;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.ChapterRepository;
import com.flexpol.backend.repository.QuizRepository;
import com.flexpol.backend.repository.SubchapterRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/** Serves quiz contents for answering. Correct answers and explanations are never included. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizService {

	private final QuizRepository quizRepository;
	private final ChapterRepository chapterRepository;
	private final SubchapterRepository subchapterRepository;

	public QuizResponse getQuiz(Long quizId) {
		return quizRepository.findById(quizId)
				.map(QuizResponse::from)
				.orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
	}

	public QuizResponse getControlQuiz(Long subchapterId) {
		if (!subchapterRepository.existsById(subchapterId)) {
			throw new ResourceNotFoundException("Subchapter", subchapterId);
		}
		return quizRepository.findBySubchapterId(subchapterId)
				.map(QuizResponse::from)
				.orElseThrow(() -> new ResourceNotFoundException("Control quiz for subchapter", subchapterId));
	}

	public QuizResponse getFinalQuiz(Long chapterId) {
		if (!chapterRepository.existsById(chapterId)) {
			throw new ResourceNotFoundException("Chapter", chapterId);
		}
		return quizRepository.findByChapterIdAndQuizType(chapterId, QuizType.FINAL)
				.map(QuizResponse::from)
				.orElseThrow(() -> new ResourceNotFoundException("Final quiz for chapter", chapterId));
	}
}
