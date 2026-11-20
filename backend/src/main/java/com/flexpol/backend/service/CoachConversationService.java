package com.flexpol.backend.service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.flexpol.backend.entity.CoachConversation;
import com.flexpol.backend.entity.User;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.CoachConversationRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * Ties coach conversations to learners. A logged-in learner's conversations belong to them, and
 * nobody else can continue one: another learner, or a request without a user, gets 404 as if it
 * did not exist. Conversations started without a user stay unowned, as before the mock login.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CoachConversationService {

	private final CoachConversationRepository conversationRepository;
	private final UserService userService;

	/**
	 * Returns the conversation id to use: a new one when {@code conversationId} is null, otherwise
	 * that id after checking the learner may use it. An unknown id (for example after a restart of
	 * the in-memory database) is claimed by the current learner and starts empty.
	 *
	 * @param conversationId a normalized UUID string, or null to start a new conversation
	 */
	public String resolve(String conversationId, String userEmail) {
		Optional<User> user = userService.findCurrentUser(userEmail);
		String id = conversationId != null ? conversationId : UUID.randomUUID().toString();

		Optional<CoachConversation> existing = conversationId != null
				? conversationRepository.findById(id)
				: Optional.empty();
		if (existing.isPresent()) {
			boolean owner = user.isPresent() && existing.get().getUser().getId().equals(user.get().getId());
			if (!owner) {
				throw new ResourceNotFoundException("Coach conversation", id);
			}
		} else if (user.isPresent()) {
			conversationRepository.save(new CoachConversation(id, user.get(), Instant.now()));
		}
		return id;
	}
}
