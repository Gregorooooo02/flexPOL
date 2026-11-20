package com.flexpol.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Who owns an AI coach conversation. The messages themselves live in Spring AI's
 * {@code SPRING_AI_CHAT_MEMORY} table under the same id.
 */
@Entity
@Table(name = "coach_conversation")
@Getter
@Setter
@NoArgsConstructor
public class CoachConversation {

	/** The conversation UUID, as sent to the frontend. */
	@Id
	@Column(length = 36)
	private String id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false)
	private Instant createdAt;

	public CoachConversation(String id, User user, Instant createdAt) {
		this.id = id;
		this.user = user;
		this.createdAt = createdAt;
	}
}
