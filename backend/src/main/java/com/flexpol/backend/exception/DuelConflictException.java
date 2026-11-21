package com.flexpol.backend.exception;

import com.flexpol.backend.dto.DuelMatchResponse;

/** A recoverable phase/revision conflict, optionally carrying the caller's current snapshot. */
public class DuelConflictException extends RuntimeException {

	private final DuelMatchResponse snapshot;

	public DuelConflictException(String message) {
		this(message, null);
	}

	public DuelConflictException(String message, DuelMatchResponse snapshot) {
		super(message);
		this.snapshot = snapshot;
	}

	public DuelMatchResponse getSnapshot() {
		return snapshot;
	}
}
