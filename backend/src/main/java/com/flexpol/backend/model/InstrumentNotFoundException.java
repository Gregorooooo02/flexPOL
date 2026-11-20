package com.flexpol.backend.model;

public class InstrumentNotFoundException extends RuntimeException {

	public InstrumentNotFoundException(Long id) {
		super("Instrument " + id + " was not found");
	}
}
