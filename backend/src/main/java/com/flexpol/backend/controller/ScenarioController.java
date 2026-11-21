package com.flexpol.backend.controller;

import java.util.List;

import com.flexpol.backend.dto.ScenarioResponse;
import com.flexpol.backend.dto.ScenarioRunRequest;
import com.flexpol.backend.dto.ScenarioRunResponse;
import com.flexpol.backend.service.ScenarioRunService;
import com.flexpol.backend.service.ScenarioService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

	private final ScenarioService scenarioService;
	private final ScenarioRunService scenarioRunService;

	@GetMapping
	public List<ScenarioResponse> getScenarios() {
		return scenarioService.getScenarios();
	}

	@GetMapping("/{scenarioId}")
	public ScenarioResponse getScenario(@PathVariable Long scenarioId) {
		return scenarioService.getScenario(scenarioId);
	}

	@PostMapping("/{scenarioId}/runs")
	public ScenarioRunResponse runScenario(@PathVariable Long scenarioId, @RequestBody ScenarioRunRequest request) {
		return scenarioRunService.run(scenarioId, request);
	}
}
