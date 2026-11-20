package com.flexpol.backend.exception;

/** Thrown when a request is missing required data; mapped to 400 Bad Request. */
public class BadRequestException extends RuntimeException {

	public BadRequestException(String message) {
		super(message);
	}
}
