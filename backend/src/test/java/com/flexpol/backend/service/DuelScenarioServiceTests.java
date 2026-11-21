package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Random;

import com.flexpol.backend.dto.DuelScenarioResponse;
import com.flexpol.backend.dto.InstrumentResponse;
import com.flexpol.backend.model.SimulationConfigurationResponse;
import com.flexpol.backend.model.enums.AssetClass;
import com.flexpol.backend.model.enums.HistoryValueType;
import com.flexpol.backend.model.enums.RiskLevel;
import com.flexpol.backend.simulation.GbmSimulationEngine;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ByteArrayResource;

import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
class DuelScenarioServiceTests {

	@Autowired
	private DuelScenarioService scenarioService;

	@Autowired
	private JsonMapper jsonMapper;

	@Test
	void seededCatalogueProducesAnImmutableReproducibleBriefWithoutMarketData() {
		var spec = scenarioService.generate(new Random(42));

		assertThat(scenarioService.generate(new Random(42))).isEqualTo(spec);
		assertThat(spec.templateId()).isNotBlank();
		assertThat(spec.templateVersion()).isPositive();
		assertThat(spec.title()).isNotBlank();
		assertThat(spec.background()).isNotBlank();
		assertThat(spec.objective()).isNotBlank();
		assertThat(spec.budget()).isPositive().hasScaleOf(2);
		assertThat(spec.durationDays()).isBetween(1, 3650);
		assertThat(spec.rules()).isNotEmpty();
		assertThat(spec.disclaimer()).contains("synthetic", "luck");
		assertThat(spec.instruments()).hasSizeGreaterThanOrEqualTo(2).allSatisfy(instrument -> {
			assertThat(instrument.assetClass()).isEqualTo(spec.category());
			assertThat(instrument.currency()).isEqualTo("EUR");
		});
		assertThatThrownBy(() -> spec.instruments().clear()).isInstanceOf(UnsupportedOperationException.class);
		var response = DuelScenarioResponse.from(spec);
		assertThat(response.instruments()).extracting(DuelScenarioResponse.AllowedInstrument::id)
				.containsExactlyElementsOf(spec.instruments().stream().map(instrument -> instrument.id()).toList());
		assertThat(jsonMapper.writeValueAsString(response)).doesNotContain("randomSeed", "simulationConfiguration", "parameters");
		// Persisting/restoring the snapshot needs no catalogue lookup or regeneration.
		assertThat(jsonMapper.readValue(jsonMapper.writeValueAsString(spec), spec.getClass())).isEqualTo(spec);
	}

	@Test
	void eligibilityExcludesWrongCurrencyCategoryAndMissingOrUnsupportedModels() {
		var catalogue = mock(InstrumentService.class);
		when(catalogue.getInstruments()).thenReturn(List.of(
				instrument(2, AssetClass.STOCK, "EUR", "GBM"),
				instrument(1, AssetClass.STOCK, "EUR", "GBM"),
				instrument(3, AssetClass.STOCK, "USD", "GBM"),
				instrument(4, AssetClass.EQUITY_ETF, "EUR", "GBM"),
				instrument(5, AssetClass.STOCK, "EUR", null),
				instrument(6, AssetClass.STOCK, "EUR", "UNKNOWN"),
				instrument(7, AssetClass.DEPOSIT, "EUR", "GBM")));
		var service = service(catalogue, content("STOCK", "5000.00", "365"));
		var spec = service.generate(new Random(1));

		assertThat(spec.category()).isEqualTo(AssetClass.STOCK);
		assertThat(spec.instruments()).extracting(instrument -> instrument.id()).containsExactly(1L, 2L);
		assertThat(spec.budget()).isEqualByComparingTo("5000.00");
		assertThat(spec.durationDays()).isEqualTo(365);
	}

	@Test
	void invalidContentAndUnavailableCategoriesFailExplicitly() {
		var catalogue = mock(InstrumentService.class);
		when(catalogue.getInstruments()).thenReturn(List.of(instrument(1, AssetClass.STOCK, "EUR", "GBM")));
		assertThatThrownBy(() -> service(catalogue, content("STOCK", "5000", "365")).generate(new Random(1)))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("at least two EUR instruments");
		assertThatThrownBy(() -> service(catalogue, content("UNKNOWN", "5000", "365")))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("category");
		assertThatThrownBy(() -> service(catalogue, content("STOCK", "0.001", "365")))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("whole cents");
		assertThatThrownBy(() -> service(catalogue, content("STOCK", "5000", "3651")))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("durationDays");
		var duplicate = content("STOCK", "5000", "365");
		var template = duplicate.substring(duplicate.indexOf("{\"id\""), duplicate.lastIndexOf(']'));
		duplicate = duplicate.substring(0, duplicate.lastIndexOf(']')) + "," + template + "]}";
		var duplicateContent = duplicate;
		assertThatThrownBy(() -> service(catalogue, duplicateContent))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("duplicate template id");
		var broken = new InstrumentResponse(2L, "Broken stock", null, AssetClass.STOCK, "EUR", RiskLevel.HIGH,
				HistoryValueType.TOTAL_RETURN_INDEX, "Demo", null, true,
				new SimulationConfigurationResponse("GBM", Map.of()));
		when(catalogue.getInstruments()).thenReturn(List.of(instrument(1, AssetClass.STOCK, "EUR", "GBM"), broken));
		assertThatThrownBy(() -> service(catalogue, content("STOCK", "5000", "365")).generate(new Random(1)))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("instrument 2", "annualExpectedReturn");
	}

	private DuelScenarioService service(InstrumentService catalogue, String content) {
		return new DuelScenarioService(catalogue, List.of(new GbmSimulationEngine()), jsonMapper,
				new ByteArrayResource(content.getBytes(StandardCharsets.UTF_8)));
	}

	private static InstrumentResponse instrument(long id, AssetClass category, String currency, String model) {
		return new InstrumentResponse(id, "Instrument " + id, null, category, currency, RiskLevel.HIGH,
				HistoryValueType.TOTAL_RETURN_INDEX, "Demo", null, true,
				model == null ? null : new SimulationConfigurationResponse(model, Map.of(
						"annualExpectedReturn", 0.06, "annualVolatility", 0.2, "periodsPerYear", 252)));
	}

	private static String content(String category, String budget, String duration) {
		return """
				{"schemaVersion":1,"currency":"EUR","disclaimer":"Synthetic competition.",
				 "rules":["Higher final value wins."],"templates":[
				 {"id":"test-template","version":1,"title":"Test duel","background":"Two fictional teams.",
				 "objective":"Compare final values.","category":"%s","categoryLabel":"Test category",
				 "options":[{"budget":%s,"durationDays":%s}]}]}
				""".formatted(category, budget, duration).strip();
	}
}
