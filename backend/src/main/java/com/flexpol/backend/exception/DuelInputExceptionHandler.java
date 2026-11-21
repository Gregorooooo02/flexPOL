package com.flexpol.backend.exception;

import com.flexpol.backend.controller.DuelController;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Keep binding failures in the Duel API's problem-detail format without changing other resources. */
@RestControllerAdvice(assignableTypes = DuelController.class)
public class DuelInputExceptionHandler {
	@ExceptionHandler({ MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class })
	public ProblemDetail handleInput() {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
				"Send a valid match UUID and a JSON portfolio with expectedRevision and allocations.");
		problem.setTitle("Bad request");
		return problem;
	}
}
