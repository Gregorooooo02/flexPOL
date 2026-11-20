package com.flexpol.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.flexpol.backend.model.HistoricalObservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HistoricalObservationRepository extends JpaRepository<HistoricalObservation, Long> {

	List<HistoricalObservation> findByInstrumentIdOrderByDateAsc(Long instrumentId);

	@Query("select max(observation.date) from HistoricalObservation observation where observation.instrument.id = :instrumentId")
	Optional<LocalDate> findLatestDateByInstrumentId(@Param("instrumentId") Long instrumentId);
}
