package com.flexpol.backend.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import com.flexpol.backend.dto.CoachResponse;
import com.flexpol.backend.entity.Subchapter;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.SubchapterRepository;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * Answers learner questions with an OpenAI model through Spring AI. The model is an educational
 * coach only: the system prompt forbids personal advice and invented simulation results. When no
 * API key is set or the call fails, the learner gets a fixed fallback reply instead of an error.
 *
 * <p>Conversations are remembered on the server: {@link MessageChatMemoryAdvisor} loads the last
 * messages of the conversation into each prompt and saves the new question and reply. The memory
 * is Spring AI's JDBC chat memory (table {@code SPRING_AI_CHAT_MEMORY}), keeping a window of the
 * last 20 messages per conversation. Only learner and coach messages are stored; the system prompt
 * and lesson context are added fresh on every call.
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
			ChatMemory chatMemory,
			SubchapterRepository subchapterRepository,
			@Value("classpath:prompts/coach-system.md") Resource systemPrompt,
			@Value("${spring.ai.openai.api-key:}") String apiKey) {
		this.chatClient = chatClientBuilder
				.defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
				.build();
		this.subchapterRepository = subchapterRepository;
		this.systemPrompt = read(systemPrompt);
		this.configured = StringUtils.hasText(apiKey);
		if (!configured) {
			log.warn("OPENAI_API_KEY is not set; the AI coach will answer with a fallback message");
		}
	}

	/**
	 * Sends one learner message to the coach.
	 *
	 * @param conversationId id from an earlier reply to continue that conversation, or null to start a new one
	 */
	public CoachResponse ask(String message, Long subchapterId, String conversationId) {
		if (!StringUtils.hasText(message)) {
			throw new BadRequestException("message is required");
		}
		if (message.length() > MAX_MESSAGE_LENGTH) {
			throw new BadRequestException("message must be at most " + MAX_MESSAGE_LENGTH + " characters");
		}
		String conversation = conversationId == null ? UUID.randomUUID().toString() : normalize(conversationId);
		// Lesson text goes in as a template parameter, so braces in the Markdown are never parsed.
		String lesson = subchapterId == null ? null : lessonContext(subchapterId);

		if (!configured) {
			return fallback(conversation);
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
					.advisors(advisor -> advisor.param(ChatMemory.CONVERSATION_ID, conversation))
					.call()
					.content();
			return StringUtils.hasText(reply)
					? new CoachResponse(reply.strip(), true, conversation)
					: fallback(conversation);
		} catch (RuntimeException ex) {
			// The advisor has already saved the question; the next call simply sees it unanswered.
			log.warn("AI coach call failed: {}", ex.toString());
			return fallback(conversation);
		}
	}

	private static CoachResponse fallback(String conversationId) {
		return new CoachResponse(FALLBACK_REPLY, false, conversationId);
	}

	/** Conversation ids are UUIDs created by this service; anything else is rejected. */
	private static String normalize(String conversationId) {
		try {
			return UUID.fromString(conversationId.strip()).toString();
		} catch (IllegalArgumentException ex) {
			throw new BadRequestException("conversationId must be a UUID returned by the coach");
		}
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
