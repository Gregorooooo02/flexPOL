package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;

import com.flexpol.backend.dto.SimulationRequest;

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
}
