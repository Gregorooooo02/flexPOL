package com.flexpol.backend.service;

import java.util.List;

import com.flexpol.backend.dto.ScenarioResponse;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.repository.ScenarioRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/** Reads the sandbox scenarios seeded from knowledge/sandbox-scenarios.json. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScenarioService {

	private final ScenarioRepository scenarioRepository;

	public List<ScenarioResponse> getScenarios() {
		return scenarioRepository.findAllByOrderBySortOrderAsc().stream()
				.map(ScenarioResponse::from)
				.toList();
	}

	public ScenarioResponse getScenario(Long scenarioId) {
		return scenarioRepository.findById(scenarioId)
				.map(ScenarioResponse::from)
				.orElseThrow(() -> new ResourceNotFoundException("Scenario", scenarioId));
	}
}
