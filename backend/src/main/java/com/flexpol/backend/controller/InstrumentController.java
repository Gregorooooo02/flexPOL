package com.flexpol.backend.controller;

import java.util.List;

import com.flexpol.backend.dto.HistoricalObservationResponse;
import com.flexpol.backend.dto.InstrumentResponse;
import com.flexpol.backend.service.InstrumentService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/instruments")
public class InstrumentController {

	// Wiring is established now; service operations are implemented in Part 5.
	private final InstrumentService instrumentService;

	public InstrumentController(InstrumentService instrumentService) {
		this.instrumentService = instrumentService;
	}

	@GetMapping
	public ResponseEntity<List<InstrumentResponse>> getInstruments() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@GetMapping("/{id}")
	public ResponseEntity<InstrumentResponse> getInstrument(@PathVariable("id") Long id) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@GetMapping("/{id}/history")
	public ResponseEntity<List<HistoricalObservationResponse>> getHistory(@PathVariable("id") Long id) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}
}
