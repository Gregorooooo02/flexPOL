package com.flexpol.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;

/** Checks answering a question against the seeded data (question 1: options 1-4, option 3 is correct). */
@SpringBootTest
@AutoConfigureMockMvc
class QuestionControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void correctAnswerReturnsExplanation() throws Exception {
		mockMvc.perform(answer(1, "{\"optionId\": 3}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.questionId").value(1))
				.andExpect(jsonPath("$.selectedOptionId").value(3))
				.andExpect(jsonPath("$.correct").value(true))
				.andExpect(jsonPath("$.correctOptionId").value(3))
				.andExpect(jsonPath("$.explanation").isString());
	}

	@Test
	void wrongAnswerRevealsCorrectOption() throws Exception {
		mockMvc.perform(answer(1, "{\"optionId\": 1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.correct").value(false))
				.andExpect(jsonPath("$.correctOptionId").value(3));
	}

	@Test
	void rejectsInvalidAnswers() throws Exception {
		// Option 5 belongs to question 2
		mockMvc.perform(answer(1, "{\"optionId\": 5}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.status").value(404));
		mockMvc.perform(answer(9999, "{\"optionId\": 1}")).andExpect(status().isNotFound());
		mockMvc.perform(answer(1, "{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("optionId is required"));
	}

	private static RequestBuilder answer(long questionId, String body) {
		return post("/api/questions/{questionId}/answer", questionId)
				.contentType(MediaType.APPLICATION_JSON)
				.content(body);
	}
}
