package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import com.flexpol.backend.dto.SimulationRequest;
import com.flexpol.backend.model.FrozenSimulationDefinition;
import com.flexpol.backend.model.SimulationContext;
import com.flexpol.backend.model.SimulationPoint;
import com.flexpol.backend.model.SimulationTrajectory;
import com.flexpol.backend.simulation.GbmSimulationEngine;
import com.flexpol.backend.simulation.SimulationEngine;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Checks batch simulation against the seeded instruments. */
@SpringBootTest
class SimulationServiceTests {

	private static final BigDecimal BASE = new BigDecimal("10000");

	@Autowired
	private SimulationService simulationService;

	private static SimulationRequest request(long instrumentId, int durationDays, Long seed) {
		return new SimulationRequest(instrumentId, BASE, durationDays, seed);
	}

	@Test
	void omittedSeedsAreIndependentAndReplayable() {
		var results = simulationService.simulateBatch(List.of(
				request(1001, 365, null), request(1002, 365, null), request(1013, 365, null)));

		assertThat(results).extracting(result -> result.randomSeed()).doesNotHaveDuplicates();
		var replay = simulationService.simulate(request(1001, 365, results.getFirst().randomSeed()));
		assertThat(replay.points()).isEqualTo(results.getFirst().points());
	}

	@Test
	void resultsKeepRequestOrderAndShareOneTimeline() {
		var results = simulationService.simulateBatch(List.of(
				request(1013, 90, null), request(1001, 90, null), request(1002, 90, null)));

		assertThat(results).extracting(result -> result.instrumentId()).containsExactly(1013L, 1001L, 1002L);
		for (var result : results) {
			assertThat(result.startDate()).isEqualTo(results.getFirst().startDate());
			assertThat(result.endDate()).isEqualTo(results.getFirst().endDate());
			assertThat(result.points().getFirst().investmentValue()).isEqualByComparingTo(BASE);
			assertThat(result.points()).extracting(point -> point.date())
					.isEqualTo(results.getFirst().points().stream().map(point -> point.date()).toList());
		}
	}

	@Test
	void explicitSeedIsUsedAsGiven() {
		var results = simulationService.simulateBatch(List.of(request(1001, 90, 42L), request(1002, 90, null)));

		assertThat(results.getFirst().randomSeed()).isEqualTo(42L);
		assertThat(results.getFirst().points())
				.isEqualTo(simulationService.simulate(request(1001, 90, 42L)).points());
	}

	@Test
	void rejectsInvalidBatches() {
		assertThatThrownBy(() -> simulationService.simulateBatch(List.of(request(1001, 90, null), request(1002, 180, null))))
				.isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> simulationService.simulateBatch(List.of(request(1001, 90, null), request(1001, 90, null))))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void frozenSimulationUsesItsAnchorAndDefinitionsWithoutReadingTheCatalogue() {
		var catalogue = mock(InstrumentService.class);
		var detached = new SimulationService(catalogue, List.of(new GbmSimulationEngine()));
		var frozen = List.of(simulationService.freezeDefinition(1001L), simulationService.freezeDefinition(1013L));
		var anchor = LocalDate.of(2030, 1, 1);
		var result = detached.simulateFrozen(frozen, anchor, 30, BASE, 42);

		assertThat(detached.simulateFrozen(frozen, anchor, 30, BASE, 42)).isEqualTo(result);
		assertThat(result).allSatisfy(item -> {
			assertThat(item.startDate()).isEqualTo(anchor);
			assertThat(item.endDate()).isEqualTo(anchor.plusDays(30));
			assertThat(item.points().stream().map(point -> point.date()).toList())
					.isEqualTo(result.getFirst().points().stream().map(point -> point.date()).toList());
		});
		var oldVersion = new FrozenSimulationDefinition(1001L, "EUR", "GBM", "unavailable", frozen.getFirst().parameters());
		assertThatThrownBy(() -> detached.simulateFrozen(List.of(oldVersion), anchor, 30, BASE, 42))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("version");
		verifyNoInteractions(catalogue);
	}

	@Test
	void frozenSimulationRejectsDifferentInteriorDatesEvenWhenEndpointsMatch() {
		var engine = mock(SimulationEngine.class);
		when(engine.modelKey()).thenReturn("TEST");
		when(engine.modelVersion()).thenReturn("test-v1");
		var calls = new AtomicInteger();
		when(engine.simulate(any())).thenAnswer(invocation -> {
			SimulationContext context = invocation.getArgument(0);
			return new SimulationTrajectory(context.endDate(), List.of(
					new SimulationPoint(context.startDate(), BASE),
					new SimulationPoint(context.startDate().plusDays(calls.incrementAndGet()), BASE),
					new SimulationPoint(context.endDate(), BASE)));
		});
		var service = new SimulationService(mock(InstrumentService.class), List.of(engine));
		var definitions = List.of(new FrozenSimulationDefinition(1L, "EUR", "TEST", "test-v1", Map.of()),
				new FrozenSimulationDefinition(2L, "EUR", "TEST", "test-v1", Map.of()));
		assertThatThrownBy(() -> service.simulateFrozen(definitions, LocalDate.of(2030, 1, 1), 3, BASE, 42))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("every point date");
	}
}
