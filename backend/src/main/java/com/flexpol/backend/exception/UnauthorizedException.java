package com.flexpol.backend.exception;

/** Thrown when a request needs a logged-in user and has none; mapped to 401 Unauthorized. */
public class UnauthorizedException extends RuntimeException {

	public UnauthorizedException(String message) {
		super(message);
	}
}
