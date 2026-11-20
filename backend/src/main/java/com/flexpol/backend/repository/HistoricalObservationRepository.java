package com.flexpol.backend.repository;

import java.util.List;

import com.flexpol.backend.model.HistoricalObservation;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoricalObservationRepository extends JpaRepository<HistoricalObservation, Long> {

	List<HistoricalObservation> findByInstrumentIdOrderByDateAsc(Long instrumentId);
}
