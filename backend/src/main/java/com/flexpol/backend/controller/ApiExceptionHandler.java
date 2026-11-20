package com.flexpol.backend.controller;

import com.flexpol.backend.model.InstrumentNotFoundException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(InstrumentNotFoundException.class)
	public ResponseEntity<ProblemDetail> instrumentNotFound(InstrumentNotFoundException error) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, error.getMessage()));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ProblemDetail> invalidRequest(IllegalArgumentException error) {
		return ResponseEntity.badRequest()
				.body(ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, error.getMessage()));
	}
}
