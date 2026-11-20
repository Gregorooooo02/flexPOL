package com.flexpol.backend.dto;

/** Mock login: the learner's display name and the email that identifies them. */
public record LoginRequest(String username, String email) {
}
