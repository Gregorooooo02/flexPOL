package com.flexpol.backend.service;

import java.util.Comparator;

import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.entity.QuizType;
import com.flexpol.backend.entity.Subchapter;
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
	 */
	public String questionContext(Long questionId, Long selectedOptionId) {
		Question question = questionRepository.findById(questionId)
				.orElseThrow(() -> new ResourceNotFoundException("Question", questionId));
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
		question.getOptions().stream()
				.sorted(Comparator.comparing(AnswerOption::getLabel))
				.forEach(option -> text.append(option.getLabel()).append(") ").append(option.getText()).append('\n'));
		text.append('\n').append(answerGuidance(question, selected, scored));
		return text.toString();
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
