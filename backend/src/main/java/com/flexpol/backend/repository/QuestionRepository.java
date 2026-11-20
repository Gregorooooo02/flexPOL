package com.flexpol.backend.repository;

import java.util.List;

import com.flexpol.backend.entity.Question;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {

	List<Question> findByQuizIdOrderBySortOrderAsc(Long quizId);
}
