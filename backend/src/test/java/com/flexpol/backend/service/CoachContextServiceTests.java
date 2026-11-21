package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.flexpol.backend.entity.NumberExercise;
import com.flexpol.backend.entity.NumberExercise.Dial;
import com.flexpol.backend.entity.NumberExercise.Lab;
import com.flexpol.backend.entity.PortfolioComparison;
import com.flexpol.backend.entity.PortfolioComparison.Portfolio;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.repository.QuestionRepository;
import com.flexpol.backend.repository.SubchapterRepository;

import org.junit.jupiter.api.Test;

class CoachContextServiceTests {

	private final QuestionRepository repository = mock(QuestionRepository.class);
	private final CoachContextService coach = new CoachContextService(mock(SubchapterRepository.class), repository);

	@Test
	void comparisonOutcomesStayHiddenUntilRevealedThenMatchTheScreen() {
		Question question = question("Portfolio A lost 30% and B lost 5%. The gap is 25 percentage points.");
		question.setComparison(new PortfolioComparison("Nova Robotics", 10_000, 50, List.of(
				new Portfolio("a", "Portfolio A", 60, "60% Nova Robotics · 40% other companies"),
				new Portfolio("b", "Portfolio B", 10, "10% Nova Robotics · 90% other companies"))));
		question.setNumberExercise(new NumberExercise("Difference between the two losses", "percentage points",
				BigDecimal.valueOf(25), "Subtract the smaller loss from the larger one.", null, new Dial(100, 5)));

		assertThat(coach.questionContext(1L, null, null, null, null))
				.contains("have not revealed the outcomes", "Do not say which portfolio loses more")
				.doesNotContain("lost 30%", "lost more.");
		assertThat(coach.questionContext(1L, null, null, null, "b"))
				.contains("They predicted Portfolio B would lose more (not right)",
						"Portfolio A: lost 30% (3,000 coins), 7,000 coins left",
						"Portfolio B: lost 5% (500 coins), 9,500 coins left",
						"Portfolio A lost more.")
				.doesNotContain(question.getExplanation());
		assertThatThrownBy(() -> coach.questionContext(1L, null, null, null, "c"))
				.isInstanceOf(BadRequestException.class);
	}

	@Test
	void wrongLabAnswerGetsTheToolsReadoutAndBuildsOnTheHintOnScreen() {
		Question question = question("The balance crosses 2,000 coins in year 15.");
		question.setNumberExercise(new NumberExercise("Turn the calendar", "years", BigDecimal.valueOf(15),
				"Find a year above 2,000, then move back.", new Lab(Lab.Kind.COMPOUNDING, 25, 1, 0, 1000, 5, null), null));

		assertThat(coach.questionContext(1L, null, null, new BigDecimal("14"), null))
				.contains("\"Time machine\"", "They checked 14 years, which is not correct",
						"after 14 years, 1,979.93 coins", "The screen now shows them this hint", "Do not reveal the number")
				.doesNotContain(question.getExplanation());
		// A value the slider cannot reach gets no readout rather than a made-up one.
		assertThat(coach.questionContext(1L, null, null, new BigDecimal("2.5"), null))
				.contains("They checked 2.5 years").doesNotContain("the screen showed");
	}

	private Question question(String explanation) {
		Question question = new Question();
		question.setId(1L);
		question.setPrompt("Work it out.");
		question.setExplanation(explanation);
		when(repository.findById(1L)).thenReturn(Optional.of(question));
		return question;
	}
}
