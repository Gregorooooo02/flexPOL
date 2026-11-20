package com.flexpol.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.Chapter;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.entity.Quiz;
import com.flexpol.backend.entity.QuizAttempt;
import com.flexpol.backend.entity.QuizType;
import com.flexpol.backend.entity.Subchapter;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/** Checks the learning content generated from knowledge/ into data.sql. */
@SpringBootTest
@Transactional
class LearningContentRepositoryTests {

	@Autowired
	private ChapterRepository chapterRepository;

	@Autowired
	private SubchapterRepository subchapterRepository;

	@Autowired
	private QuizRepository quizRepository;

	@Autowired
	private QuestionRepository questionRepository;

	@Autowired
	private AnswerOptionRepository answerOptionRepository;

	@Autowired
	private QuizAttemptRepository quizAttemptRepository;

	@Autowired
	private UserRepository userRepository;

	@Test
	void loadsChaptersInOrder() {
		assertThat(chapterRepository.findAllByOrderBySortOrderAsc())
				.extracting(Chapter::getTitle)
				.containsExactly("Why Invest?", "Know Your Instruments", "Investing Through Life");
	}

	@Test
	void loadsSubchaptersWithLessons() {
		assertThat(subchapterRepository.count()).isEqualTo(19);

		Subchapter liquidity = subchapterRepository.findByCode("1.3").orElseThrow();
		assertThat(liquidity.getTitle()).isEqualTo("Time Horizon and Liquidity");
		assertThat(liquidity.getChapter().getSortOrder()).isEqualTo(1);
		assertThat(liquidity.getLessonMarkdown())
				.startsWith("### Time horizon")
				.contains("| **High** |")
				.doesNotContain("## Control questions");

		assertThat(subchapterRepository.findByCode("2.2").orElseThrow().getSandboxInstrument())
				.isEqualTo("LOCKED_TERM");
	}

	@Test
	void everySubchapterHasAControlQuizAndEveryChapterAFinalQuiz() {
		for (Subchapter subchapter : subchapterRepository.findAll()) {
			Quiz control = quizRepository.findBySubchapterId(subchapter.getId()).orElseThrow();
			assertThat(control.getQuizType()).isEqualTo(QuizType.CONTROL);
			assertThat(control.getQuestions()).hasSizeBetween(4, 5);
		}
		for (Chapter chapter : chapterRepository.findAll()) {
			Quiz finalQuiz = quizRepository.findByChapterIdAndQuizType(chapter.getId(), QuizType.FINAL).orElseThrow();
			assertThat(finalQuiz.getQuestions()).hasSize(10);
			assertThat(finalQuiz.getPassMark()).isEqualTo(7);
			assertThat(finalQuiz.getQuestions()).allSatisfy(q -> assertThat(q.getSourceSubchapter()).isNotNull());
		}
		assertThat(quizRepository.count()).isEqualTo(22);
	}

	@Test
	void everyQuestionHasOptionsAToDWithExactlyOneCorrect() {
		List<Question> questions = questionRepository.findAll();
		assertThat(questions).hasSize(117);
		for (Question question : questions) {
			List<AnswerOption> options = answerOptionRepository.findByQuestionIdOrderByLabelAsc(question.getId());
			assertThat(options).extracting(AnswerOption::getLabel).containsExactly("A", "B", "C", "D");
			assertThat(options).filteredOn(AnswerOption::isCorrect).hasSize(1);
			assertThat(question.getExplanation()).isNotBlank();
		}
	}

	@Test
	void correctAnswersAreSpreadAcrossLetters() {
		Map<String, Long> correctByLabel = answerOptionRepository.findAll().stream()
				.filter(AnswerOption::isCorrect)
				.collect(Collectors.groupingBy(AnswerOption::getLabel, Collectors.counting()));
		assertThat(correctByLabel).containsOnlyKeys("A", "B", "C", "D");
		assertThat(correctByLabel.values()).allSatisfy(count -> assertThat(count).isLessThan(117 / 2));
	}

	@Test
	void savesAttemptWithIdAfterSeededRows() {
		QuizAttempt attempt = new QuizAttempt();
		attempt.setUser(userRepository.findAll().getFirst());
		attempt.setQuiz(quizRepository.findAll().getFirst());
		attempt.setStartedAt(Instant.now());

		QuizAttempt saved = quizAttemptRepository.save(attempt);

		assertThat(saved.getId()).isNotNull();
		assertThat(quizAttemptRepository.findByUserIdAndQuizIdOrderByStartedAtDesc(
				saved.getUser().getId(), saved.getQuiz().getId())).containsExactly(saved);
	}
}
