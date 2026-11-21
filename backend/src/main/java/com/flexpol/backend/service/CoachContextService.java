package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Comparator;
import java.util.Locale;
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
 *
 * <p>Interactive exercises are described the way the screen shows them: the kind of card task,
 * the slider tool and its readout at the checked value (computed here, so the model never does
 * the arithmetic), and for a what-if comparison whether the outcomes have been revealed yet.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CoachContextService {

	private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

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
	 * @param comparisonPrediction the portfolio the learner predicted would lose more, once they have revealed
	 *        the outcomes of the question's what-if comparison; null before the reveal
	 */
	public String questionContext(Long questionId, Long selectedOptionId, Map<String, String> assignments,
			BigDecimal number, String comparisonPrediction) {
		Question question = questionRepository.findById(questionId)
				.orElseThrow(() -> new ResourceNotFoundException("Question", questionId));
		if (comparisonPrediction != null && question.getComparison() == null) {
			throw new BadRequestException("comparisonPrediction is only for questions with a portfolio comparison");
		}
		if (question.getAssignment() != null) {
			if (selectedOptionId != null || number != null) {
				throw new BadRequestException("This question accepts assignments instead of selectedOptionId");
			}
			return assignmentContext(question, assignments);
		}
		// An answer can only be checked after the reveal, so a checked answer means the outcomes are on screen.
		boolean answered = selectedOptionId != null || number != null;
		if (question.getNumberExercise() != null) {
			if (selectedOptionId != null || assignments != null) {
				throw new BadRequestException("This question accepts a number only");
			}
			return numberContext(question, number, comparisonPrediction, answered);
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
		appendComparison(text, question.getComparison(), comparisonPrediction, answered);
		question.getOptions().stream()
				.sorted(Comparator.comparing(AnswerOption::getLabel))
				.forEach(option -> text.append(option.getLabel()).append(") ").append(option.getText()).append('\n'));
		text.append('\n').append(answerGuidance(question, selected, scored));
		return text.toString();
	}

	/**
	 * The predict-then-reveal step. Before the reveal the model gets the setup only and is told not to
	 * give the prediction away; after it, the losses the screen shows.
	 */
	private static void appendComparison(StringBuilder text, PortfolioComparison comparison, String prediction, boolean answered) {
		if (comparison == null) {
			return;
		}
		PortfolioComparison.Portfolio predicted = prediction == null ? null : comparison.portfolios().stream()
				.filter(portfolio -> portfolio.id().equals(prediction))
				.findFirst()
				.orElseThrow(() -> new BadRequestException("comparisonPrediction must be one of this question's portfolios"));
		text.append("\nThe screen shows a what-if: ").append(comparison.company()).append(" drops ")
				.append(comparison.dropPercent()).append("%, all other holdings stay unchanged, and both portfolios start with ")
				.append(format(BigDecimal.valueOf(comparison.startingBalance()))).append(" coins.\n");
		for (PortfolioComparison.Portfolio portfolio : comparison.portfolios()) {
			text.append("- ").append(portfolio.name()).append(": ").append(portfolio.description()).append('\n');
		}
		text.append("The learner first predicts which portfolio loses more and presses Reveal outcomes; "
				+ "the answer appears only after that.\n");
		if (predicted == null && !answered) {
			text.append("They have not revealed the outcomes yet. Do not say which portfolio loses more and do not work "
					+ "out either loss. Help them reason about how much of each portfolio is exposed to ")
					.append(comparison.company()).append(".\n\n");
			return;
		}
		PortfolioComparison.Portfolio larger = comparison.portfolios().stream()
				.max(Comparator.comparingInt(PortfolioComparison.Portfolio::exposurePercent))
				.orElseThrow();
		text.append(predicted == null ? "They have revealed the outcomes."
				: "They predicted " + predicted.name() + " would lose more ("
						+ (predicted == larger ? "right" : "not right") + ") and revealed the outcomes.")
				.append(" The screen now shows:\n");
		BigDecimal balance = BigDecimal.valueOf(comparison.startingBalance());
		for (PortfolioComparison.Portfolio portfolio : comparison.portfolios()) {
			BigDecimal lossPercent = BigDecimal.valueOf((long) portfolio.exposurePercent() * comparison.dropPercent())
					.divide(HUNDRED);
			BigDecimal loss = balance.multiply(lossPercent).divide(HUNDRED);
			text.append("- ").append(portfolio.name()).append(": lost ").append(format(lossPercent)).append("% (")
					.append(format(loss)).append(" coins), ").append(format(balance.subtract(loss))).append(" coins left\n");
		}
		text.append(larger.name()).append(" lost more.\n\n");
	}

	private static String numberContext(Question question, BigDecimal number, String prediction, boolean answered) {
		NumberExercise exercise = question.getNumberExercise();
		boolean correct = number != null && QuestionService.checkNumber(exercise, number);
		StringBuilder text = new StringBuilder(
				"The learner is on a practice exercise and can retry until they get it right.\n\nQuestion: ")
				.append(question.getPrompt()).append('\n');
		appendComparison(text, question.getComparison(), prediction, answered);
		text.append("They answer with a slider labelled \"").append(exercise.label()).append("\" in ")
				.append(exercise.unit()).append(".\n");
		NumberExercise.Lab lab = exercise.lab();
		if (lab == null) {
			text.append("It goes from 0 to ").append(withUnit(BigDecimal.valueOf(exercise.dial().max()), exercise.unit()))
					.append(" in steps of ").append(exercise.dial().step()).append(", with - and + buttons.\n");
		} else {
			text.append(describeLab(lab, exercise.unit())).append('\n');
		}
		text.append('\n');
		if (number != null) {
			text.append("They checked ").append(withUnit(number, exercise.unit()))
					.append(correct ? ", which is correct." : ", which is not correct, and they can try again.");
			String readout = lab == null ? null : labReadout(lab, number);
			if (readout != null) {
				text.append(" At that value the screen showed: ").append(readout);
			}
			text.append(' ');
		}
		if (correct) {
			return text.append(explanation(question).strip()).append(" You can discuss why it is right.").toString();
		}
		String noReveal = "Do not reveal the number and do not do the final calculation for them.";
		if (number == null) {
			return text.append("They have not checked an answer yet. Help them reason it out with hints and guiding questions")
					.append(lab == null ? "" : ", and suggest trying values on the slider and watching what the tool shows")
					.append(". ").append(noReveal).append(" Authored hint you can build on (not on screen yet): ")
					.append(exercise.hint()).toString();
		}
		return text.append("The screen now shows them this hint: \"").append(exercise.hint()).append("\" ")
				.append("Do not just repeat it: try a different angle, a smaller step, or a question about what they see. ")
				.append(noReveal).toString();
	}

	/** What the lab on screen is and what it shows, using the names the learner sees. */
	private static String describeLab(NumberExercise.Lab lab, String unit) {
		String range = "from 0 to " + withUnit(BigDecimal.valueOf(lab.max()), unit) + " in steps of " + lab.step();
		String balance = format(BigDecimal.valueOf(lab.balance()));
		return switch (lab.kind()) {
			case COMPOUNDING -> "The tool above it is the \"Time machine\": the slider (" + range + ") picks a number of years, "
					+ "and it draws the growth curve and shows the balance after that many years. It starts with " + balance
					+ " coins growing " + lab.rate() + "% a year, compounded yearly (balance × (1 + rate) to the power of years).";
			case LOCKBOX -> "The tool above it is \"The lockbox\": the slider (" + range + ") sets how many of the " + balance
					+ " coins are locked away. It shows the coins in your pocket (the rest) and in the lockbox, and whether the "
					+ "pocket covers a bill of " + format(BigDecimal.valueOf(lab.bill())) + " coins (\"Short by …\" or "
					+ "\"Bill covered · … spare coins\").";
			case SHOCK -> "The tool above it is the \"Crash test\": the slider (" + range + ") sets the share of a " + balance
					+ "-coin portfolio held in the one company that drops " + lab.rate() + "%; the rest of the basket holds "
					+ "steady. It shows the coins left after the drop and the portfolio's loss in percent.";
		};
	}

	/** The lab's readout at {@code value}, as the screen shows it, or null for a value the slider cannot reach. */
	private static String labReadout(NumberExercise.Lab lab, BigDecimal value) {
		if (value.signum() < 0 || value.compareTo(BigDecimal.valueOf(lab.max())) > 0 || value.stripTrailingZeros().scale() > 0) {
			return null;
		}
		int amount = value.intValueExact();
		BigDecimal balance = BigDecimal.valueOf(lab.balance());
		return switch (lab.kind()) {
			case COMPOUNDING -> "after " + amount + (amount == 1 ? " year, " : " years, ")
					+ format(balance.multiply(BigDecimal.valueOf(100L + lab.rate()).movePointLeft(2).pow(amount))) + " coins.";
			case LOCKBOX -> {
				BigDecimal pocket = balance.subtract(value);
				BigDecimal gap = BigDecimal.valueOf(lab.bill()).subtract(pocket);
				yield format(pocket) + " coins in the pocket and " + format(value) + " in the lockbox; "
						+ (gap.signum() > 0 ? "short by " + format(gap) + " coins for the bill."
								: "bill covered with " + format(gap.negate()) + " spare coins.");
			}
			case SHOCK -> {
				BigDecimal lossPercent = value.multiply(BigDecimal.valueOf(lab.rate())).divide(HUNDRED);
				BigDecimal left = balance.multiply(HUNDRED.subtract(lossPercent)).divide(HUNDRED);
				yield format(left) + " coins left after the drop, a loss of " + format(lossPercent) + "%.";
			}
		};
	}

	private static String assignmentContext(Question question, Map<String, String> assignments) {
		AssignmentExercise exercise = question.getAssignment();
		boolean matching = exercise.mode() == AssignmentExercise.Mode.MATCH;
		boolean correct = assignments != null && AssignmentGrading.isCorrect(exercise, assignments);
		Map<String, String> targets = exercise.targets().stream().collect(Collectors.toMap(
				AssignmentExercise.Target::id, AssignmentExercise.Target::text));
		StringBuilder text = new StringBuilder(
				"The learner is on a practice card exercise and can retry until they get it right.\n\nQuestion: ")
				.append(question.getPrompt()).append('\n')
				.append(matching
						? "Task, shown as \"Connect the pairs\": link each card to one match; every match is used exactly once.\n"
						: "Task, shown as \"Sort the cards\": put each card into a bin; a bin can hold several cards and "
								+ "every card needs one.\n");
		if (exercise.cards().stream().anyMatch(card -> card.prices() != null)) {
			text.append("Cards with prices show them as a small line chart; all charts share one price scale, and a dashed "
					+ "line marks each card's starting price.\n");
		}
		text.append("Cards:\n");
		for (AssignmentExercise.Card card : exercise.cards()) {
			text.append("- ").append(card.text());
			if (card.prices() != null) {
				text.append(" (prices in order: ").append(card.prices().stream().map(String::valueOf)
						.collect(Collectors.joining(", "))).append(')');
			}
			if (assignments != null) {
				text.append(" — placed in: ").append(targets.get(assignments.get(card.id())));
			}
			text.append('\n');
		}
		text.append(matching ? "Matches: " : "Bins: ").append(exercise.targets().stream()
				.map(AssignmentExercise.Target::text).collect(Collectors.joining("; "))).append("\n\n");
		if (correct) {
			return text.append("They checked their placements and all are correct.").append(explanation(question))
					.append(" You can discuss why each card belongs where it is.").toString();
		}
		String noReveal = "Do not say where any card belongs, and do not confirm or rule out any single placement.";
		if (assignments == null) {
			return text.append("They have not checked their placements yet. Guide them with the core idea or a question "
					+ "about one card's situation. ").append(noReveal)
					.append(" Authored hint you can build on (not on screen yet): ").append(exercise.hint()).toString();
		}
		return text.append("They checked these placements and at least one is wrong; the screen does not say which. "
				+ "It now shows them this hint: \"").append(exercise.hint()).append("\" Do not just repeat it: ask them "
						+ "to explain their reasoning for a card, or try a different angle. ")
				.append(noReveal).toString();
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

	/** A value with its unit as the screen writes it ("20%", "15 years"), unrounded: answers have up to six decimals. */
	private static String withUnit(BigDecimal value, String unit) {
		return format(value, "#,##0.######") + ("%".equals(unit) ? "" : " ") + unit;
	}

	/** Like the screen's {@code Intl.NumberFormat('en', { maximumFractionDigits: 2 })}: "1,979.93". */
	private static String format(BigDecimal value) {
		return format(value, "#,##0.##");
	}

	private static String format(BigDecimal value, String pattern) {
		DecimalFormat format = new DecimalFormat(pattern, DecimalFormatSymbols.getInstance(Locale.ENGLISH));
		format.setRoundingMode(RoundingMode.HALF_UP);
		return format.format(value);
	}
}
