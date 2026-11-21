package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.AssignmentExercise;
import com.flexpol.backend.entity.NumberExercise;
import com.flexpol.backend.entity.PortfolioComparison;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.entity.QuizType;
import com.flexpol.backend.entity.Subchapter;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.QuestionRepository;
import com.flexpol.backend.repository.SubchapterRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * Describes where the learner is (lesson, quiz question, their answer) as plain text for the
 * coach's system prompt. It runs in its own read-only transaction, so the slow model call in
 * {@link CoachService} never holds one open.
 *
 * <p>The question text also tells the model how much it may reveal. It mirrors what the quiz
 * screen already shows: the correct option and explanation are only included once the learner
 * has answered and the screen reveals them (a correct answer, or any answer in a scored test).
 * A wrong answer in a practice quiz, where the learner retries, never includes them.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CoachContextService {

	private final SubchapterRepository subchapterRepository;
	private final QuestionRepository questionRepository;

	public String lessonContext(Long subchapterId) {
		Subchapter subchapter = subchapterRepository.findById(subchapterId)
				.orElseThrow(() -> new ResourceNotFoundException("Subchapter", subchapterId));
		return subchapter.getCode() + " " + subchapter.getTitle() + "\n\n" + subchapter.getLessonMarkdown();
	}

	/**
	 * @param selectedOptionId the option the learner picked and had checked, or null if they have not answered
	 * @param assignments the card placements the learner checked, or null if they have not answered
	 * @param number the value the learner checked, or null if they have not answered
	 */
	public String questionContext(Long questionId, Long selectedOptionId, Map<String, String> assignments, BigDecimal number) {
		Question question = questionRepository.findById(questionId)
				.orElseThrow(() -> new ResourceNotFoundException("Question", questionId));
		if (question.getAssignment() != null) {
			if (selectedOptionId != null || number != null) {
				throw new BadRequestException("This question accepts assignments instead of selectedOptionId");
			}
			return assignmentContext(question, assignments);
		}
		if (question.getNumberExercise() != null) {
			if (selectedOptionId != null || assignments != null) {
				throw new BadRequestException("This question accepts a number only");
			}
			return numberContext(question, number);
		}
		if (assignments != null || number != null) {
			throw new BadRequestException("This question accepts selectedOptionId only");
		}
		boolean scored = question.getQuiz().getQuizType() == QuizType.FINAL;
		AnswerOption selected = selectedOptionId == null ? null : question.getOptions().stream()
				.filter(option -> option.getId().equals(selectedOptionId))
				.findFirst()
				.orElseThrow(() -> new ResourceNotFoundException("Answer option of question " + questionId, selectedOptionId));

		StringBuilder text = new StringBuilder()
				.append(scored
						? "The learner is taking a scored chapter test (one try per question) and is on this question:"
						: "The learner is on this practice question (they can retry until they get it right):")
				.append("\n\nQuestion: ").append(question.getPrompt()).append('\n');
		appendComparison(text, question.getComparison());
		question.getOptions().stream()
				.sorted(Comparator.comparing(AnswerOption::getLabel))
				.forEach(option -> text.append(option.getLabel()).append(") ").append(option.getText()).append('\n'));
		text.append('\n').append(answerGuidance(question, selected, scored));
		return text.toString();
	}

	private static void appendComparison(StringBuilder text, PortfolioComparison comparison) {
		if (comparison != null) {
			text.append("The example starts with ").append(comparison.startingBalance())
					.append(" coins per portfolio. ").append(comparison.company()).append(" falls ")
					.append(comparison.dropPercent()).append("%. All other holdings stay unchanged.\n");
			for (PortfolioComparison.Portfolio portfolio : comparison.portfolios()) {
				text.append(portfolio.name()).append(": ").append(portfolio.description()).append('\n');
			}
		}
	}

	private static String numberContext(Question question, BigDecimal number) {
		NumberExercise exercise = question.getNumberExercise();
		boolean correct = number != null && QuestionService.checkNumber(exercise, number);
		StringBuilder text = new StringBuilder("The learner is on a practice exercise.\n\nQuestion: ")
				.append(question.getPrompt()).append('\n').append(exercise.label()).append(" (").append(exercise.unit()).append(").\n");
		appendComparison(text, question.getComparison());
		if (number != null) {
			text.append("They checked ").append(number.stripTrailingZeros().toPlainString()).append(' ').append(exercise.unit()).append(". ");
		}
		if (correct) {
			return text.append("Their answer is correct.").append(explanation(question)).toString();
		}
		return text.append("Offer a hint and let them try. Do not reveal the number. Hint: ").append(exercise.hint()).toString();
	}

	private static String assignmentContext(Question question, Map<String, String> assignments) {
		AssignmentExercise exercise = question.getAssignment();
		boolean correct = assignments != null && AssignmentGrading.isCorrect(exercise, assignments);
		Map<String, String> targets = exercise.targets().stream().collect(Collectors.toMap(
				AssignmentExercise.Target::id, AssignmentExercise.Target::text));
		StringBuilder text = new StringBuilder("The learner is on a practice card assignment and can retry.\n\nQuestion: ")
				.append(question.getPrompt()).append("\nCards:\n");
		for (AssignmentExercise.Card card : exercise.cards()) {
			text.append("- ").append(card.text());
			if (card.prices() != null) {
				text.append(" (price series ").append(card.prices()).append(')');
			}
			if (assignments != null) {
				text.append(" — placed in: ").append(targets.get(assignments.get(card.id())));
			}
			text.append('\n');
		}
		text.append("Destinations: ").append(exercise.targets().stream().map(AssignmentExercise.Target::text)
				.collect(Collectors.joining("; "))).append("\n\n");
		if (correct) {
			return text.append("They checked their placements and all are correct.").append(explanation(question)).toString();
		}
		return text.append(assignments == null ? "They have not checked any placements yet. " : "Some checked placements are wrong. ")
				.append("Guide them with the core idea or a question. Do not reveal any correct placements. Hint: ")
				.append(exercise.hint()).toString();
	}

	private static String answerGuidance(Question question, AnswerOption selected, boolean scored) {
		if (selected == null) {
			return scored
					? "They have not answered yet. This is a test: you may explain what the question is asking or what "
							+ "its terms mean, but give no hints about which option is right and do not rule options in or out. "
							+ "If they ask for the answer, kindly say they need to answer this one themselves and that you can "
							+ "go through it together afterwards."
					: "They have not answered yet. Help them reason it out with hints and guiding questions about the "
							+ "concept. Do not say which option is correct and do not go through the options ruling them out "
							+ "one by one.";
		}
		String picked = "They picked " + selected.getLabel() + ") " + selected.getText();
		if (selected.isCorrect()) {
			return picked + ", which is correct." + explanation(question)
					+ " You can discuss why it is right and why the other options are not.";
		}
		if (!scored) {
			return picked + ", which is not correct, and they can try again. Help them see why their choice does "
					+ "not fit and point them back to the key idea, but do not say which option is correct.";
		}
		AnswerOption correct = question.getOptions().stream()
				.filter(AnswerOption::isCorrect)
				.findFirst()
				.orElseThrow(() -> new IllegalStateException("Question " + question.getId() + " has no correct option"));
		return picked + ", which is not correct. Their answer is locked and the screen already shows the correct "
				+ "answer: " + correct.getLabel() + ") " + correct.getText() + "." + explanation(question)
				+ " You can explain it fully.";
	}

	private static String explanation(Question question) {
		return question.getExplanation() == null ? "" : " Explanation: " + question.getExplanation();
	}
}
