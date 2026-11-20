package com.flexpol.backend.repository;

import com.flexpol.backend.entity.CoachConversation;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CoachConversationRepository extends JpaRepository<CoachConversation, String> {
}
