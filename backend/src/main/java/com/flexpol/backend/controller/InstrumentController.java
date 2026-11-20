package com.flexpol.backend.controller;

import java.util.List;

import com.flexpol.backend.dto.HistoricalObservationResponse;
import com.flexpol.backend.dto.InstrumentResponse;
import com.flexpol.backend.service.InstrumentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/instruments")
public class InstrumentController {

	private final InstrumentService instrumentService;

	public InstrumentController(InstrumentService instrumentService) {
		this.instrumentService = instrumentService;
	}

	@GetMapping
	public ResponseEntity<List<InstrumentResponse>> getInstruments() {
		return ResponseEntity.ok(instrumentService.getInstruments());
	}

	@GetMapping("/{id}")
	public ResponseEntity<InstrumentResponse> getInstrument(@PathVariable("id") Long id) {
		return ResponseEntity.ok(instrumentService.getInstrument(id));
	}

	@GetMapping("/{id}/history")
	public ResponseEntity<List<HistoricalObservationResponse>> getHistory(@PathVariable("id") Long id) {
		return ResponseEntity.ok(instrumentService.getHistory(id));
	}
}
