package com.flexpol.backend.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.flexpol.backend.dto.CoachRequest;
import com.flexpol.backend.dto.CoachResponse;
import com.flexpol.backend.exception.BadRequestException;

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
	/** Appended to the system prompt when the learner asks while on a quiz question. */
	private static final String QUESTION_SECTION = "\n\nRight now, {question}";

	private final ChatClient chatClient;
	private final CoachContextService contextService;
	private final CoachConversationService conversationService;
	private final String systemPrompt;
	private final boolean configured;

	public CoachService(
			ChatClient.Builder chatClientBuilder,
			ChatMemory chatMemory,
			CoachContextService contextService,
			CoachConversationService conversationService,
			@Value("classpath:prompts/coach-system.md") Resource systemPrompt,
			@Value("${spring.ai.openai.api-key:}") String apiKey) {
		this.chatClient = chatClientBuilder
				.defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
				.build();
		this.contextService = contextService;
		this.conversationService = conversationService;
		this.systemPrompt = read(systemPrompt);
		this.configured = StringUtils.hasText(apiKey);
		if (!configured) {
			log.warn("OPENAI_API_KEY is not set; the AI coach will answer with a fallback message");
		}
	}

	/**
	 * Sends one learner message to the coach, with the lesson and quiz question they are on as context.
	 * Without a {@code conversationId} a new conversation starts; its id is returned in the response.
	 * With {@code userEmail} (the {@code X-User-Email} header) the conversation belongs to that learner,
	 * and only they can continue it ({@link CoachConversationService}).
	 */
	public CoachResponse ask(CoachRequest request, String userEmail) {
		String message = request.message();
		if (!StringUtils.hasText(message)) {
			throw new BadRequestException("message is required");
		}
		if (message.length() > MAX_MESSAGE_LENGTH) {
			throw new BadRequestException("message must be at most " + MAX_MESSAGE_LENGTH + " characters");
		}
		if (request.selectedOptionId() != null && request.questionId() == null) {
			throw new BadRequestException("selectedOptionId requires questionId");
		}
		if (request.assignments() != null && request.questionId() == null) {
			throw new BadRequestException("assignments requires questionId");
		}
		String requestedConversation = request.conversationId() == null ? null : normalize(request.conversationId());

		// Context goes in as template parameters, so braces in lesson or question text are never parsed.
		Map<String, Object> params = new HashMap<>();
		StringBuilder system = new StringBuilder(systemPrompt);
		if (request.subchapterId() != null) {
			system.append(LESSON_SECTION);
			params.put("lesson", contextService.lessonContext(request.subchapterId()));
		}
		if (request.questionId() != null) {
			system.append(QUESTION_SECTION);
			params.put("question", contextService.questionContext(
					request.questionId(), request.selectedOptionId(), request.assignments()));
		}
		// After the context checks, so a rejected request doesn't leave an empty conversation behind.
		String conversation = conversationService.resolve(requestedConversation, userEmail);

		if (!configured) {
			return fallback(conversation);
		}
		try {
			String reply = chatClient.prompt()
					.system(spec -> spec.text(system.toString()).params(params))
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

	private static String read(Resource resource) {
		try {
			return resource.getContentAsString(StandardCharsets.UTF_8);
		} catch (IOException ex) {
			throw new UncheckedIOException("Could not read the coach system prompt " + resource, ex);
		}
	}
}
