package com.flexpol.backend.repository;

import java.util.List;

import com.flexpol.backend.entity.AnswerOption;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerOptionRepository extends JpaRepository<AnswerOption, Long> {

	List<AnswerOption> findByQuestionIdOrderByLabelAsc(Long questionId);
}
