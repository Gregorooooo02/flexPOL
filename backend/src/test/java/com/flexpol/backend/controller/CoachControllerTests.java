package com.flexpol.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import com.flexpol.backend.service.CoachService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;

/**
 * Checks the coach endpoint against a stub chat model, so no request ever reaches OpenAI.
 * The stub replaces the OpenAI auto-configured model and records the last prompt it received.
 */
@SpringBootTest(properties = "spring.ai.openai.api-key=test-key")
@AutoConfigureMockMvc
class CoachControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private StubChatModel chatModel;

	@BeforeEach
	void reset() {
		chatModel.lastPrompt.set(null);
		chatModel.fail = false;
	}

	@Test
	void returnsModelReply() throws Exception {
		mockMvc.perform(ask("{\"message\": \"What is diversification?\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reply").value(StubChatModel.REPLY))
				.andExpect(jsonPath("$.aiAvailable").value(true));

		Prompt prompt = chatModel.lastPrompt.get();
		assertThat(text(prompt, MessageType.SYSTEM)).contains("not a personal investment adviser");
		assertThat(text(prompt, MessageType.SYSTEM)).doesNotContain("currently studying");
		assertThat(text(prompt, MessageType.USER)).isEqualTo("What is diversification?");
	}

	@Test
	void groundsReplyInTheCurrentLesson() throws Exception {
		mockMvc.perform(ask("{\"message\": \"Can you explain {this} part?\", \"subchapterId\": 1}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.aiAvailable").value(true));

		Prompt prompt = chatModel.lastPrompt.get();
		assertThat(text(prompt, MessageType.SYSTEM)).contains("currently studying this lesson").contains("1.1 ");
		assertThat(text(prompt, MessageType.USER)).isEqualTo("Can you explain {this} part?");
	}

	@Test
	void fallsBackWhenTheModelFails() throws Exception {
		chatModel.fail = true;
		mockMvc.perform(ask("{\"message\": \"Hi\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reply").value(CoachService.FALLBACK_REPLY))
				.andExpect(jsonPath("$.aiAvailable").value(false));
	}

	@Test
	void rejectsInvalidRequests() throws Exception {
		mockMvc.perform(ask("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("message is required"));
		mockMvc.perform(ask("{\"message\": \"" + "a".repeat(CoachService.MAX_MESSAGE_LENGTH + 1) + "\"}"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(ask("{\"message\": \"Hi\", \"subchapterId\": 9999}"))
				.andExpect(status().isNotFound());
		assertThat(chatModel.lastPrompt.get()).isNull();
	}

	private static String text(Prompt prompt, MessageType type) {
		return prompt.getInstructions().stream()
				.filter(message -> message.getMessageType() == type)
				.map(message -> message.getText())
				.reduce("", String::concat);
	}

	private static RequestBuilder ask(String body) {
		return post("/api/coach/messages").contentType(MediaType.APPLICATION_JSON).content(body);
	}

	@TestConfiguration
	static class StubChatModelConfig {

		@Bean
		StubChatModel chatModel() {
			return new StubChatModel();
		}
	}

	static class StubChatModel implements ChatModel {

		static final String REPLY = "Diversification means not putting all your eggs in one basket.";

		final AtomicReference<Prompt> lastPrompt = new AtomicReference<>();
		volatile boolean fail;

		@Override
		public ChatResponse call(Prompt prompt) {
			lastPrompt.set(prompt);
			if (fail) {
				throw new IllegalStateException("simulated OpenAI outage");
			}
			return new ChatResponse(List.of(new Generation(new AssistantMessage(REPLY))));
		}
	}
}
