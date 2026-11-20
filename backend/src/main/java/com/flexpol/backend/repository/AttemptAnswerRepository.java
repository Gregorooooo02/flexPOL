package com.flexpol.backend.repository;

import java.util.List;

import com.flexpol.backend.entity.AttemptAnswer;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {

	List<AttemptAnswer> findByAttemptId(Long attemptId);
}
