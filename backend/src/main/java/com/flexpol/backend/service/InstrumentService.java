package com.flexpol.backend.service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.flexpol.backend.dto.HistoricalObservationResponse;
import com.flexpol.backend.dto.InstrumentResponse;
import com.flexpol.backend.model.Instrument;
import com.flexpol.backend.model.InstrumentNotFoundException;
import com.flexpol.backend.model.SimulationConfiguration;
import com.flexpol.backend.model.SimulationConfigurationResponse;
import com.flexpol.backend.model.SimulationDefinition;
import com.flexpol.backend.repository.HistoricalObservationRepository;
import com.flexpol.backend.repository.InstrumentRepository;
import com.flexpol.backend.repository.SimulationConfigurationRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class InstrumentService {

	private final InstrumentRepository instrumentRepository;
	private final HistoricalObservationRepository observationRepository;
	private final SimulationConfigurationRepository configurationRepository;
	private final JsonMapper jsonMapper;

	public List<InstrumentResponse> getInstruments() {
		var configurations = configurationRepository.findAll().stream()
				.collect(Collectors.toMap(configuration -> configuration.getInstrument().getId(), Function.identity()));
		return instrumentRepository.findAll(Sort.by("id")).stream()
				.map(instrument -> toResponse(instrument, configurations.get(instrument.getId())))
				.toList();
	}

	public InstrumentResponse getInstrument(Long id) {
		var instrument = requireInstrument(id);
		return toResponse(instrument, configurationRepository.findByInstrumentId(id).orElse(null));
	}

	public List<HistoricalObservationResponse> getHistory(Long id) {
		if (!instrumentRepository.existsById(id)) {
			throw new InstrumentNotFoundException(id);
		}
		return observationRepository.findByInstrumentIdOrderByDateAsc(id).stream()
				.map(observation -> new HistoricalObservationResponse(
						observation.getDate(), observation.getOriginalDate(), observation.getValue()))
				.toList();
	}

	public SimulationDefinition getSimulationDefinition(Long id) {
		var configuration = configurationRepository.findByInstrumentId(id)
				.orElseThrow(() -> new IllegalStateException("No simulation configuration for instrument " + id));
		var instrument = requireInstrument(id);
		return new SimulationDefinition(id, instrument.getCurrency(),
				observationRepository.findLatestDateByInstrumentId(id).orElse(null),
				instrument.isHistoryRebased(), configurationResponse(configuration));
	}

	private Instrument requireInstrument(Long id) {
		return instrumentRepository.findById(id).orElseThrow(() -> new InstrumentNotFoundException(id));
	}

	private InstrumentResponse toResponse(Instrument instrument, SimulationConfiguration configuration) {
		return new InstrumentResponse(instrument.getId(), instrument.getName(), instrument.getDescription(),
				instrument.getAssetClass(), instrument.getCurrency(), instrument.getRiskLevel(),
				instrument.getHistoryValueType(), instrument.getHistorySource(), instrument.getHistoryDescription(),
				instrument.isHistoryRebased(), configuration == null ? null : configurationResponse(configuration));
	}

	private SimulationConfigurationResponse configurationResponse(SimulationConfiguration configuration) {
		try {
			Map<String, Object> parameters = jsonMapper.readerFor(new TypeReference<Map<String, Object>>() { })
					.with(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
					.readValue(configuration.getParametersJson());
			if (parameters == null) {
				throw new IllegalStateException("Simulation parameters must be a JSON object");
			}
			return new SimulationConfigurationResponse(configuration.getModelKey(),
					Collections.unmodifiableMap(new LinkedHashMap<>(parameters)));
		} catch (JacksonException error) {
			throw new IllegalStateException("Invalid simulation parameter JSON for configuration " + configuration.getId(), error);
		}
	}
}
