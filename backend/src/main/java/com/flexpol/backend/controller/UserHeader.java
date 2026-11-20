package com.flexpol.backend.controller;

/**
 * Mock login: the frontend sends the logged-in learner's email in this header with every request.
 * It identifies the learner but proves nothing, so it is only fit for the hackathon demo.
 */
public final class UserHeader {

	public static final String NAME = "X-User-Email";

	private UserHeader() {
	}
}
