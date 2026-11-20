package com.flexpol.backend.service;

import java.time.Instant;

import com.flexpol.backend.dto.QuizAttemptResponse;
import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.AttemptAnswer;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.entity.Quiz;
import com.flexpol.backend.entity.QuizAttempt;
import com.flexpol.backend.entity.User;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.AttemptAnswerRepository;
import com.flexpol.backend.repository.QuizAttemptRepository;
import com.flexpol.backend.repository.QuizRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * Records learners' quiz attempts. The frontend starts an attempt when the learner begins the
 * questions, then sends its id with each answer. Only the first answer to each question is saved,
 * so practice retries don't change the score. Once every question has an answer the attempt is
 * completed: {@code score} is the number of correct first answers, and {@code passed} compares it
 * with the quiz's {@code passMark} (quizzes without one are always passed, as on the quiz screen).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizAttemptService {

	private final QuizRepository quizRepository;
	private final QuizAttemptRepository attemptRepository;
	private final AttemptAnswerRepository answerRepository;
	private final UserService userService;

	@Transactional
	public QuizAttemptResponse start(Long quizId, String userEmail) {
		User user = userService.requireCurrentUser(userEmail);
		Quiz quiz = quizRepository.findById(quizId)
				.orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
		QuizAttempt attempt = new QuizAttempt();
		attempt.setUser(user);
		attempt.setQuiz(quiz);
		attempt.setStartedAt(Instant.now());
		return QuizAttemptResponse.from(attemptRepository.save(attempt));
	}

	public QuizAttemptResponse get(Long attemptId, String userEmail) {
		User user = userService.requireCurrentUser(userEmail);
		return QuizAttemptResponse.from(findOwned(attemptId, user));
	}

	/**
	 * Saves the learner's answer in their attempt, unless the question already has one or the attempt
	 * is complete. Runs in the caller's transaction ({@link QuestionService}).
	 */
	@Transactional
	public void recordAnswer(Long attemptId, User user, Question question, AnswerOption selected) {
		QuizAttempt attempt = findOwned(attemptId, user);
		if (!attempt.getQuiz().getId().equals(question.getQuiz().getId())) {
			throw new BadRequestException("Question " + question.getId() + " is not part of quiz attempt " + attemptId);
		}
		if (attempt.getCompletedAt() != null) {
			return;
		}
		boolean alreadyAnswered = attempt.getAnswers().stream()
				.anyMatch(answer -> answer.getQuestion().getId().equals(question.getId()));
		if (alreadyAnswered) {
			return;
		}

		AttemptAnswer answer = new AttemptAnswer();
		answer.setAttempt(attempt);
		answer.setQuestion(question);
		answer.setSelectedOption(selected);
		answer.setCorrect(selected.isCorrect());
		attempt.getAnswers().add(answerRepository.save(answer));

		if (attempt.getAnswers().size() >= attempt.getQuiz().getQuestions().size()) {
			complete(attempt);
		}
	}

	private static void complete(QuizAttempt attempt) {
		int score = (int) attempt.getAnswers().stream().filter(AttemptAnswer::isCorrect).count();
		Integer passMark = attempt.getQuiz().getPassMark();
		attempt.setScore(score);
		attempt.setPassed(passMark == null || score >= passMark);
		attempt.setCompletedAt(Instant.now());
	}

	/** Another learner's attempt is reported as not found, so attempt ids reveal nothing. */
	private QuizAttempt findOwned(Long attemptId, User user) {
		return attemptRepository.findById(attemptId)
				.filter(attempt -> attempt.getUser().getId().equals(user.getId()))
				.orElseThrow(() -> new ResourceNotFoundException("Quiz attempt", attemptId));
	}
}
