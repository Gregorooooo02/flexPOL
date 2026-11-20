package com.flexpol.backend.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

import com.flexpol.backend.dto.CoachResponse;
import com.flexpol.backend.entity.Subchapter;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.SubchapterRepository;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * Answers learner questions with an OpenAI model through Spring AI. The model is an educational
 * coach only: the system prompt forbids personal advice and invented simulation results. When no
 * API key is set or the call fails, the learner gets a fixed fallback reply instead of an error.
 */
@Slf4j
@Service
public class CoachService {

	public static final int MAX_MESSAGE_LENGTH = 2000;
	public static final String FALLBACK_REPLY = "The AI coach is not available right now. "
			+ "Try re-reading the lesson, or check the explanation after answering a question.";

	/** Appended to the system prompt when the learner asks from inside a lesson. */
	private static final String LESSON_SECTION = "\n\nThe learner is currently studying this lesson:\n\n{lesson}";

	private final ChatClient chatClient;
	private final SubchapterRepository subchapterRepository;
	private final String systemPrompt;
	private final boolean configured;

	public CoachService(
			ChatClient.Builder chatClientBuilder,
			SubchapterRepository subchapterRepository,
			@Value("classpath:prompts/coach-system.md") Resource systemPrompt,
			@Value("${spring.ai.openai.api-key:}") String apiKey) {
		this.chatClient = chatClientBuilder.build();
		this.subchapterRepository = subchapterRepository;
		this.systemPrompt = read(systemPrompt);
		this.configured = StringUtils.hasText(apiKey);
		if (!configured) {
			log.warn("OPENAI_API_KEY is not set; the AI coach will answer with a fallback message");
		}
	}

	public CoachResponse ask(String message, Long subchapterId) {
		if (!StringUtils.hasText(message)) {
			throw new BadRequestException("message is required");
		}
		if (message.length() > MAX_MESSAGE_LENGTH) {
			throw new BadRequestException("message must be at most " + MAX_MESSAGE_LENGTH + " characters");
		}
		// Lesson text goes in as a template parameter, so braces in the Markdown are never parsed.
		String lesson = subchapterId == null ? null : lessonContext(subchapterId);

		if (!configured) {
			return new CoachResponse(FALLBACK_REPLY, false);
		}
		try {
			String reply = chatClient.prompt()
					.system(system -> {
						if (lesson == null) {
							system.text(systemPrompt);
						} else {
							system.text(systemPrompt + LESSON_SECTION).param("lesson", lesson);
						}
					})
					.user(message)
					.call()
					.content();
			return StringUtils.hasText(reply) ? new CoachResponse(reply.strip(), true) : fallback();
		} catch (RuntimeException ex) {
			log.warn("AI coach call failed: {}", ex.toString());
			return fallback();
		}
	}

	private static CoachResponse fallback() {
		return new CoachResponse(FALLBACK_REPLY, false);
	}

	private String lessonContext(Long subchapterId) {
		Subchapter subchapter = subchapterRepository.findById(subchapterId)
				.orElseThrow(() -> new ResourceNotFoundException("Subchapter", subchapterId));
		return subchapter.getCode() + " " + subchapter.getTitle() + "\n\n" + subchapter.getLessonMarkdown();
	}

	private static String read(Resource resource) {
		try {
			return resource.getContentAsString(StandardCharsets.UTF_8);
		} catch (IOException ex) {
			throw new UncheckedIOException("Could not read the coach system prompt " + resource, ex);
		}
	}
}
