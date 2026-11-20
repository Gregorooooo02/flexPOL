package com.flexpol.backend.controller;

import java.util.List;

import com.flexpol.backend.dto.SimulationRequest;
import com.flexpol.backend.dto.SimulationResult;
import com.flexpol.backend.service.SimulationService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulations")
@RequiredArgsConstructor
public class SimulationController {

	private final SimulationService simulationService;

	@PostMapping
	public ResponseEntity<SimulationResult> simulate(@RequestBody SimulationRequest request) {
		return ResponseEntity.ok(simulationService.simulate(request));
	}

	@PostMapping("/batch")
	public ResponseEntity<List<SimulationResult>> simulateBatch(@RequestBody List<SimulationRequest> requests) {
		return ResponseEntity.ok(simulationService.simulateBatch(requests));
	}

	/** Invalid simulation input is a client error. Scoped to this controller so other endpoints are unaffected. */
	@ExceptionHandler(IllegalArgumentException.class)
	public ProblemDetail invalidRequest(IllegalArgumentException error) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, error.getMessage());
		problem.setTitle("Bad request");
		return problem;
	}
}
