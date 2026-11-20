package com.flexpol.backend.repository;

import java.util.Optional;

import com.flexpol.backend.model.SimulationConfiguration;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SimulationConfigurationRepository extends JpaRepository<SimulationConfiguration, Long> {

	Optional<SimulationConfiguration> findByInstrumentId(Long instrumentId);
}
