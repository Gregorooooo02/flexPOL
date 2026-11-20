package com.flexpol.backend.repository;

import com.flexpol.backend.model.Instrument;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InstrumentRepository extends JpaRepository<Instrument, Long> {
}
