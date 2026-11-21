package com.flexpol.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import com.flexpol.backend.entity.AnswerOption;
import com.flexpol.backend.entity.Question;
import com.flexpol.backend.entity.Quiz;
import com.flexpol.backend.entity.QuizType;
import com.flexpol.backend.repository.QuizRepository;
import com.jayway.jsonpath.JsonPath;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/**
 * Saving quiz attempts for the learner named by the X-User-Email header. Uses the seeded quizzes and
 * users, and is rolled back after each test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class QuizAttemptControllerTests {

	private static final String JAN = "jan.kowalski@example.com";
	private static final String ANNA = "anna.nowak@example.com";
	private static final JsonMapper JSON = JsonMapper.builder().build();

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private QuizRepository quizRepository;

	@Test
	void practiceQuizScoresFirstAnswersAndIgnoresRetries() throws Exception {
		Quiz quiz = quizRepository.findBySubchapterId(1L).orElseThrow();
		List<Question> questions = quiz.getQuestions();
		long attemptId = startAttempt(quiz.getId(), JAN);

		// First question: wrong, then the retry is right. Only the wrong first answer counts.
		Question first = questions.getFirst();
		answer(first, wrongOption(first), attemptId, JAN).andExpect(jsonPath("$.correct").value(false));
		answer(first, correctOption(first), attemptId, JAN).andExpect(jsonPath("$.correct").value(true));

		mockMvc.perform(getAttempt(attemptId, JAN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.answeredCount").value(1))
				.andExpect(jsonPath("$.questionCount").value(questions.size()))
				.andExpect(jsonPath("$.completedAt").doesNotExist())
				.andExpect(jsonPath("$.score").doesNotExist());

		for (Question question : questions.subList(1, questions.size())) {
			Map<String, ?> body;
			if (question.getAssignment() != null) {
				body = Map.of("attemptId", attemptId, "assignments", question.getAssignment().solution());
			} else if (question.getNumberExercise() != null) {
				body = Map.of("attemptId", attemptId, "number", question.getNumberExercise().answer());
			} else {
				body = Map.of("attemptId", attemptId, "optionId", correctOption(question).getId());
			}
			mockMvc.perform(post("/api/questions/{questionId}/answer", question.getId())
					.contentType(MediaType.APPLICATION_JSON).header(UserHeader.NAME, JAN)
					.content(JSON.writeValueAsString(body)))
					.andExpect(status().isOk()).andExpect(jsonPath("$.correct").value(true));
		}

		mockMvc.perform(getAttempt(attemptId, JAN))
				.andExpect(jsonPath("$.quizId").value(quiz.getId()))
				.andExpect(jsonPath("$.answeredCount").value(questions.size()))
				.andExpect(jsonPath("$.completedAt").isString())
				.andExpect(jsonPath("$.score").value(questions.size() - 1))
				// A practice quiz has no pass mark, so finishing it is a pass
				.andExpect(jsonPath("$.passed").value(true));

		// Answers after completion are still checked, just not saved
		answer(first, wrongOption(first), attemptId, JAN).andExpect(jsonPath("$.correct").value(false));
		mockMvc.perform(getAttempt(attemptId, JAN)).andExpect(jsonPath("$.score").value(questions.size() - 1));
	}

	@Test
	void finalQuizFailsBelowPassMark() throws Exception {
		Quiz quiz = quizRepository.findByChapterIdAndQuizType(1L, QuizType.FINAL).orElseThrow();
		long attemptId = startAttempt(quiz.getId(), JAN);

		for (Question question : quiz.getQuestions()) {
			answer(question, wrongOption(question), attemptId, JAN);
		}

		mockMvc.perform(getAttempt(attemptId, JAN))
				.andExpect(jsonPath("$.score").value(0))
				.andExpect(jsonPath("$.passed").value(false));
	}

	@Test
	void attemptsBelongToTheirLearner() throws Exception {
		Quiz quiz = quizRepository.findBySubchapterId(1L).orElseThrow();
		Question question = quiz.getQuestions().getFirst();
		long attemptId = startAttempt(quiz.getId(), JAN);

		mockMvc.perform(getAttempt(attemptId, ANNA)).andExpect(status().isNotFound());
		mockMvc.perform(submit(question, correctOption(question), attemptId).header(UserHeader.NAME, ANNA))
				.andExpect(status().isNotFound());
		mockMvc.perform(submit(question, correctOption(question), attemptId))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsInvalidAttemptRequests() throws Exception {
		mockMvc.perform(post("/api/quizzes/{quizId}/attempts", 1)).andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/quizzes/{quizId}/attempts", 1).header(UserHeader.NAME, "nobody@example.com"))
				.andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/quizzes/{quizId}/attempts", 9999).header(UserHeader.NAME, JAN))
				.andExpect(status().isNotFound());
		mockMvc.perform(getAttempt(9999, JAN)).andExpect(status().isNotFound());

		// A question from another quiz can't be saved in this attempt
		long attemptId = startAttempt(quizRepository.findBySubchapterId(1L).orElseThrow().getId(), JAN);
		Question other = quizRepository.findBySubchapterId(2L).orElseThrow().getQuestions().getFirst();
		mockMvc.perform(submit(other, correctOption(other), attemptId).header(UserHeader.NAME, JAN))
				.andExpect(status().isBadRequest());
	}

	private long startAttempt(long quizId, String email) throws Exception {
		String body = mockMvc.perform(post("/api/quizzes/{quizId}/attempts", quizId).header(UserHeader.NAME, email))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.answeredCount").value(0))
				.andReturn().getResponse().getContentAsString();
		return ((Number) JsonPath.read(body, "$.id")).longValue();
	}

	private ResultActions answer(
			Question question, AnswerOption option, long attemptId, String email) throws Exception {
		return mockMvc.perform(submit(question, option, attemptId).header(UserHeader.NAME, email))
				.andExpect(status().isOk());
	}

	private static MockHttpServletRequestBuilder submit(Question question, AnswerOption option, long attemptId) {
		return post("/api/questions/{questionId}/answer", question.getId())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"optionId\": " + option.getId() + ", \"attemptId\": " + attemptId + "}");
	}

	private static MockHttpServletRequestBuilder getAttempt(long attemptId, String email) {
		return get("/api/quiz-attempts/{attemptId}", attemptId).header(UserHeader.NAME, email);
	}

	private static AnswerOption correctOption(Question question) {
		return question.getOptions().stream().filter(AnswerOption::isCorrect).findFirst().orElseThrow();
	}

	private static AnswerOption wrongOption(Question question) {
		return question.getOptions().stream().filter(option -> !option.isCorrect()).findFirst().orElseThrow();
	}
}
