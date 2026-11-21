package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.flexpol.backend.entity.AttemptAnswer;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.entity.Quiz;
import com.flexpol.backend.entity.QuizAttempt;
import com.flexpol.backend.entity.User;
import com.flexpol.backend.repository.AttemptAnswerRepository;
import com.flexpol.backend.repository.QuizAttemptRepository;
import com.flexpol.backend.repository.QuizRepository;

import org.junit.jupiter.api.Test;

class QuizAttemptServiceTests {

	@Test
	void recordsOnlyTheFirstSetOfPlacementsAndScoresIt() {
		QuizAttemptRepository attempts = mock(QuizAttemptRepository.class);
		AttemptAnswerRepository answers = mock(AttemptAnswerRepository.class);
		var service = new QuizAttemptService(mock(QuizRepository.class), attempts, answers, mock(UserService.class));
		User user = new User();
		user.setId(3L);
		Quiz quiz = new Quiz();
		quiz.setId(7L);
		Question first = new Question();
		first.setId(1L);
		first.setQuiz(quiz);
		Question second = new Question();
		second.setId(2L);
		second.setQuiz(quiz);
		quiz.setQuestions(List.of(first, second));
		QuizAttempt attempt = new QuizAttempt();
		attempt.setQuiz(quiz);
		when(attempts.findOwnedForUpdate(5L, 3L)).thenReturn(Optional.of(attempt));
		when(answers.save(any(AttemptAnswer.class))).thenAnswer(call -> call.getArgument(0));
		var wrong = Map.of("holiday", "long");
		var right = Map.of("holiday", "short");

		service.recordAnswer(5L, user, first, null, wrong, false);
		service.recordAnswer(5L, user, first, null, right, true);
		assertThat(attempt.getAnswers()).singleElement().satisfies(answer -> {
			assertThat(answer.getAssignments()).isEqualTo(wrong);
			assertThat(answer.isCorrect()).isFalse();
		});
		verify(answers).save(any(AttemptAnswer.class));

		service.recordAnswer(5L, user, second, null, right, true);
		assertThat(attempt.getCompletedAt()).isNotNull();
		assertThat(attempt.getScore()).isEqualTo(1);
		assertThat(attempt.getPassed()).isTrue();
	}
}
