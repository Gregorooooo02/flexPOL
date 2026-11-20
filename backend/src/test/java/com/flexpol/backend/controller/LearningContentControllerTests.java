package com.flexpol.backend.controller;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/** End-to-end checks of the read-only learning content API against the seeded data. */
@SpringBootTest
@AutoConfigureMockMvc
class LearningContentControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void listsChaptersWithSubchaptersAndFinalQuiz() throws Exception {
		mockMvc.perform(get("/api/chapters"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(3)))
				.andExpect(jsonPath("$[0].title").value("Why Invest?"))
				.andExpect(jsonPath("$[0].missionTitle").value("The Two-Year Goal"))
				.andExpect(jsonPath("$[0].finalQuizId").isNumber())
				.andExpect(jsonPath("$[0].subchapters", hasSize(5)))
				.andExpect(jsonPath("$[0].subchapters[0].code").value("1.1"))
				.andExpect(jsonPath("$[0].subchapters[0]", not(hasKey("lessonMarkdown"))))
				.andExpect(jsonPath("$[1].subchapters", hasSize(7)));
	}

	@Test
	void getsOneChapterAndItsSubchapters() throws Exception {
		mockMvc.perform(get("/api/chapters/2"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("Know Your Instruments"));

		mockMvc.perform(get("/api/chapters/2/subchapters"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(7)))
				.andExpect(jsonPath("$[1].code").value("2.2"))
				.andExpect(jsonPath("$[1].sandboxInstrument").value("LOCKED_TERM"));
	}

	@Test
	void getsSubchapterWithLessonMarkdown() throws Exception {
		mockMvc.perform(get("/api/subchapters/3"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value("1.3"))
				.andExpect(jsonPath("$.chapterId").value(1))
				.andExpect(jsonPath("$.lessonMarkdown", startsWith("### Time horizon")))
				.andExpect(jsonPath("$.controlQuizId").isNumber());
	}

	@Test
	void controlQuizHidesAnswersAndExplanations() throws Exception {
		mockMvc.perform(get("/api/subchapters/3/control-quiz"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quizType").value("CONTROL"))
				.andExpect(jsonPath("$.subchapterId").value(3))
				.andExpect(jsonPath("$.questions", hasSize(5)))
				.andExpect(jsonPath("$.questions[0].options", hasSize(4)))
				.andExpect(jsonPath("$.questions[0].options[*].label").value(org.hamcrest.Matchers.contains("A", "B", "C", "D")))
				.andExpect(jsonPath("$.questions[*]", everyItem(not(hasKey("explanation")))))
				.andExpect(jsonPath("$.questions[*].options[*]", everyItem(not(hasKey("correct")))));
	}

	@Test
	void getsFinalQuizByChapterAndById() throws Exception {
		mockMvc.perform(get("/api/chapters/1/final-quiz"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quizType").value("FINAL"))
				.andExpect(jsonPath("$.passMark").value(7))
				.andExpect(jsonPath("$.subchapterId", nullValue()))
				.andExpect(jsonPath("$.questions", hasSize(10)));

		mockMvc.perform(get("/api/quizzes/6"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quizType").value("FINAL"))
				.andExpect(jsonPath("$.chapterId").value(1));
	}

	@Test
	void returnsProblemDetailForMissingResources() throws Exception {
		mockMvc.perform(get("/api/chapters/99"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.status").value(404))
				.andExpect(jsonPath("$.detail").value("Chapter 99 not found"));

		mockMvc.perform(get("/api/chapters/99/subchapters")).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/chapters/99/final-quiz")).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/subchapters/999")).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/subchapters/999/control-quiz")).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/quizzes/999")).andExpect(status().isNotFound());
	}
}
