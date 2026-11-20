package com.flexpol.backend.exception;

/** Thrown when a requested resource doesn't exist; mapped to 404 Not Found. */
public class ResourceNotFoundException extends RuntimeException {

	public ResourceNotFoundException(String resource, Object id) {
		super(resource + " " + id + " not found");
	}
}
