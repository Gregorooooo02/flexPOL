package com.flexpol.backend.service;

import com.flexpol.backend.dto.SubchapterResponse;
import com.flexpol.backend.entity.Quiz;
import com.flexpol.backend.entity.Subchapter;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.QuizRepository;
import com.flexpol.backend.repository.SubchapterRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubchapterService {

	private final SubchapterRepository subchapterRepository;
	private final QuizRepository quizRepository;

	public SubchapterResponse getSubchapter(Long subchapterId) {
		Subchapter subchapter = subchapterRepository.findById(subchapterId)
				.orElseThrow(() -> new ResourceNotFoundException("Subchapter", subchapterId));
		Long controlQuizId = quizRepository.findBySubchapterId(subchapterId).map(Quiz::getId).orElse(null);
		return SubchapterResponse.from(subchapter, controlQuizId);
	}
}
