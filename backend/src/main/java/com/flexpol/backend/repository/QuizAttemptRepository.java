package com.flexpol.backend.repository;

import java.util.List;
import java.util.Optional;

import com.flexpol.backend.entity.QuizAttempt;
import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

	List<QuizAttempt> findByUserIdAndQuizIdOrderByStartedAtDesc(Long userId, Long quizId);

	boolean existsByUserIdAndQuizIdAndPassedTrue(Long userId, Long quizId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select attempt from QuizAttempt attempt where attempt.id = :id and attempt.user.id = :userId")
	Optional<QuizAttempt> findOwnedForUpdate(@Param("id") Long id, @Param("userId") Long userId);
}
