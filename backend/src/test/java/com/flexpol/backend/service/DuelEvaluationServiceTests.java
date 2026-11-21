package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.flexpol.backend.entity.DuelOutcome;
import com.flexpol.backend.model.DuelEvaluationWork;
import com.flexpol.backend.model.DuelMarketSpec;
import com.flexpol.backend.model.DuelScenarioSpec;
import com.flexpol.backend.model.FrozenSimulationDefinition;
import com.flexpol.backend.model.SimulationContext;
import com.flexpol.backend.model.SimulationPoint;
import com.flexpol.backend.model.SimulationTrajectory;
import com.flexpol.backend.model.enums.AssetClass;
import com.flexpol.backend.model.enums.RiskLevel;
import com.flexpol.backend.simulation.SimulationEngine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DuelEvaluationServiceTests {

	private SimulationEngine engine;
	private DuelEvaluationService evaluator;

	@BeforeEach
	void sharedMarket() {
		engine = mock(SimulationEngine.class);
		when(engine.modelKey()).thenReturn("TEST");
		when(engine.modelVersion()).thenReturn("test-v1");
		when(engine.simulate(any())).thenAnswer(invocation -> {
			SimulationContext context = invocation.getArgument(0);
			return new SimulationTrajectory(context.endDate(), List.of(
					new SimulationPoint(context.startDate(), context.initialInvestment()),
					new SimulationPoint(context.startDate().plusDays(1), context.initialInvestment().multiply(new BigDecimal("1.5"))),
					new SimulationPoint(context.endDate(), context.initialInvestment().multiply(new BigDecimal("0.5")))));
		});
		evaluator = new DuelEvaluationService(new SimulationService(mock(InstrumentService.class), List.of(engine)),
				Clock.fixed(Instant.parse("2026-11-21T12:00:00Z"), ZoneOffset.UTC));
	}

	@Test
	void identicalPlansDrawAndEveryCurvePointReconcilesToCashPlusRoundedHoldings() {
		var result = evaluator.evaluate(work("333.33", "333.33"));

		assertThat(result.outcome()).isEqualTo(DuelOutcome.DRAW);
		assertThat(result.winnerId()).isNull();
		assertThat(result.players().getFirst().values()).isEqualTo(result.players().getLast().values());
		var a = result.players().getFirst();
		assertThat(a.values()).containsExactly(new BigDecimal("1000.00"), new BigDecimal("1166.67"), new BigDecimal("833.33"));
		assertThat(a.instruments().getFirst().values().getLast()).isEqualByComparingTo("166.66"); // 166.665, HALF_EVEN
		for (int i = 0; i < result.dates().size(); i++) {
			assertThat(a.values().get(i)).isEqualByComparingTo(a.cash().add(a.instruments().getFirst().values().get(i)));
		}
		assertThat(a.profit()).isEqualByComparingTo(a.instruments().getFirst().contribution());
		assertThat(a.maxDrawdown()).isBetween(BigDecimal.ZERO, BigDecimal.ONE);
		verify(engine, times(1)).simulate(any()); // held instrument simulated once, not once per player
	}

	@Test
	void differentPositionSizesSharePricesAndTheLowerLossWinsWithAnExactCentGap() {
		var result = evaluator.evaluate(work("333.33", "666.66"));
		assertThat(result.outcome()).isEqualTo(DuelOutcome.WIN);
		assertThat(result.winnerId()).isEqualTo(1L);
		assertThat(result.players()).allSatisfy(player -> assertThat(player.profit()).isNegative());
		assertThat(result.players().getLast().finalValue()).isEqualByComparingTo("666.67");
		assertThat(result.players().getLast().instruments().getFirst().values())
				.containsExactly(new BigDecimal("666.66"), new BigDecimal("999.99"), new BigDecimal("333.33"));
		assertThat(result.finalValueGap()).isEqualByComparingTo("166.66");
		assertThat(result.returnDifferencePercentagePoints()).isEqualByComparingTo("16.666");
		verify(engine, times(1)).simulate(any());
	}

	private static DuelEvaluationWork work(String first, String second) {
		var scenario = new DuelScenarioSpec(1, "test", 1, "Test", "Fictional", "Compare final values", "EUR",
				new BigDecimal("1000.00"), 2, AssetClass.STOCK, "Stocks", List.of(
						new DuelScenarioSpec.AllowedInstrument(1L, "Stock A", null, AssetClass.STOCK, "EUR", RiskLevel.HIGH),
						new DuelScenarioSpec.AllowedInstrument(2L, "Stock B", null, AssetClass.STOCK, "EUR", RiskLevel.HIGH)),
				List.of("Higher final value wins"), "Synthetic");
		var market = new DuelMarketSpec(1, DuelMarketSpec.VALUATION_VERSION, LocalDate.of(2026, 11, 23), 2,
				DuelMarketSpec.BASE_AMOUNT, 42, List.of(
						new FrozenSimulationDefinition(1L, "EUR", "TEST", "test-v1", Map.of()),
						new FrozenSimulationDefinition(2L, "EUR", "TEST", "test-v1", Map.of())));
		return new DuelEvaluationWork(UUID.randomUUID(), UUID.randomUUID(), scenario, market, List.of(
				new DuelEvaluationWork.Player(1L, "First", 1, List.of(new DuelEvaluationWork.Allocation(1L, new BigDecimal(first)))),
				new DuelEvaluationWork.Player(2L, "Second", 2, List.of(new DuelEvaluationWork.Allocation(1L, new BigDecimal(second))))));
	}
}
