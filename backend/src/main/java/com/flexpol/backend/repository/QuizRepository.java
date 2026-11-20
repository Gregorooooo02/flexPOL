package com.flexpol.backend.repository;

import java.util.Optional;

import com.flexpol.backend.entity.Quiz;
import com.flexpol.backend.entity.QuizType;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

	/** The control quiz of a subchapter. */
	Optional<Quiz> findBySubchapterId(Long subchapterId);

	/** The final quiz of a chapter: {@code findByChapterIdAndQuizType(id, QuizType.FINAL)}. */
	Optional<Quiz> findByChapterIdAndQuizType(Long chapterId, QuizType quizType);
}
