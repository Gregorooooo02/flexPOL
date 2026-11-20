package com.flexpol.backend.controller;

import com.flexpol.backend.dto.SimulationRequest;
import com.flexpol.backend.dto.SimulationResult;
import com.flexpol.backend.service.SimulationService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
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
}
