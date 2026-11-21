package com.flexpol.backend.controller;

import java.util.List;

import com.flexpol.backend.dto.ScenarioResponse;
import com.flexpol.backend.service.ScenarioService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

	private final ScenarioService scenarioService;

	@GetMapping
	public List<ScenarioResponse> getScenarios() {
		return scenarioService.getScenarios();
	}

	@GetMapping("/{scenarioId}")
	public ScenarioResponse getScenario(@PathVariable Long scenarioId) {
		return scenarioService.getScenario(scenarioId);
	}
}
