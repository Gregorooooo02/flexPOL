package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.flexpol.backend.dto.AnswerSubmissionRequest;
import com.flexpol.backend.entity.AssignmentExercise;
import com.flexpol.backend.entity.AssignmentExercise.Card;
import com.flexpol.backend.entity.AssignmentExercise.Mode;
import com.flexpol.backend.entity.AssignmentExercise.Target;
import com.flexpol.backend.entity.NumberExercise;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.entity.User;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.repository.QuestionRepository;
import com.flexpol.backend.repository.SubchapterRepository;

import org.junit.jupiter.api.Test;

class QuestionServiceTests {

	private final QuestionRepository repository = mock(QuestionRepository.class);
	private final QuizAttemptService attempts = mock(QuizAttemptService.class);
	private final UserService users = mock(UserService.class);
	private final QuestionService questions = new QuestionService(repository, attempts, users);
	private final CoachContextService coach = new CoachContextService(mock(SubchapterRepository.class), repository);

	@Test
	void sortsMultipleCardsIntoOneCategoryAndRecordsTheCheckedAnswer() {
		var solution = Map.of("holiday", "short", "laptop", "short", "retirement", "long");
		Question question = question(Mode.SORT, solution);
		User learner = new User();
		when(users.requireCurrentUser("learner@example.com")).thenReturn(learner);

		var checked = questions.checkAnswer(1L, new AnswerSubmissionRequest(null, 5L, solution, null), "learner@example.com");

		assertThat(checked.correct()).isTrue();
		assertThat(checked.explanation()).isEqualTo(question.getExplanation());
		assertThat(checked.hint()).isNull();
		verify(attempts).recordAnswer(eq(5L), eq(learner),
				argThat(answer -> answer.getQuestion() == question && solution.equals(answer.getAssignments()) && answer.isCorrect()));
	}

	@Test
	void wrongMatchGivesAHintAndTheCoachSeesTheLearnersPlacements() {
		var wrong = Map.of("holiday", "long", "retirement", "short");
		Question question = question(Mode.MATCH, Map.of("holiday", "short", "retirement", "long"));
		var checked = questions.checkAnswer(1L, new AnswerSubmissionRequest(null, null, wrong, null), null);

		assertThat(checked.correct()).isFalse();
		assertThat(checked.explanation()).isNull();
		assertThat(checked.hint()).isEqualTo(question.getAssignment().hint());
		assertThat(coach.questionContext(1L, null, wrong, null, null)).contains("Connect the pairs", "Holiday — placed in: Long-term", "Do not say where any card belongs")
				.doesNotContain(question.getExplanation());
	}

	@Test
	void rejectsIncompleteAndDuplicateMatchesBeforeSaving() {
		question(Mode.MATCH, Map.of("holiday", "short", "retirement", "long"));

		assertThatThrownBy(() -> questions.checkAnswer(1L,
				new AnswerSubmissionRequest(null, 5L, Map.of("holiday", "short"), null), null))
				.isInstanceOf(BadRequestException.class).hasMessageContaining("every card");
		assertThatThrownBy(() -> questions.checkAnswer(1L,
				new AnswerSubmissionRequest(null, 5L, Map.of("holiday", "short", "retirement", "short"), null), null))
				.isInstanceOf(BadRequestException.class).hasMessageContaining("at most once");
		verifyNoInteractions(users, attempts);
	}

	@Test
	void gradesNumbersIndependentlyOfTrailingZerosAndOffersAHintForAMiss() {
		Question question = new Question();
		question.setId(1L);
		question.setExplanation("After the fee, the remaining amount is 4.5 coins.");
		question.setNumberExercise(new NumberExercise("Balance", "coins", new BigDecimal("4.5"), "Subtract the fee.", null, null));
		when(repository.findById(1L)).thenReturn(Optional.of(question));

		var correct = questions.checkAnswer(1L, new AnswerSubmissionRequest(null, null, null, new BigDecimal("4.50")), null);
		assertThat(correct.correct()).isTrue();
		assertThat(correct.explanation()).isEqualTo(question.getExplanation());

		var wrong = questions.checkAnswer(1L, new AnswerSubmissionRequest(null, null, null, BigDecimal.ZERO), null);
		assertThat(wrong.correct()).isFalse();
		assertThat(wrong.hint()).isEqualTo("Subtract the fee.");
		assertThat(wrong.explanation()).isNull();
	}

	private Question question(Mode mode, Map<String, String> solution) {
		Question question = new Question();
		question.setId(1L);
		question.setPrompt("Place the goals by horizon.");
		question.setExplanation("Short-term goals are less than two years away.");
		List<Card> cards = mode == Mode.SORT
				? List.of(new Card("holiday", "Holiday", null), new Card("laptop", "Laptop", null), new Card("retirement", "Retirement", null))
				: List.of(new Card("holiday", "Holiday", null), new Card("retirement", "Retirement", null));
		question.setAssignment(new AssignmentExercise(mode, cards,
				List.of(new Target("short", "Short-term"), new Target("long", "Long-term")),
				solution, "When will you need the money?"));
		when(repository.findById(1L)).thenReturn(Optional.of(question));
		return question;
	}
}
