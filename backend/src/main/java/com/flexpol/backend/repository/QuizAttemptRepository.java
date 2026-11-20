package com.flexpol.backend.repository;

import java.util.List;

import com.flexpol.backend.entity.QuizAttempt;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

	List<QuizAttempt> findByUserIdAndQuizIdOrderByStartedAtDesc(Long userId, Long quizId);

	boolean existsByUserIdAndQuizIdAndPassedTrue(Long userId, Long quizId);
}
