package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.flexpol.backend.dto.DuelResultResponse;
import com.flexpol.backend.dto.SimulationResult;
import com.flexpol.backend.entity.DuelOutcome;
import com.flexpol.backend.model.DuelEvaluationWork;
import com.flexpol.backend.model.DuelMarketSpec;
import com.flexpol.backend.model.DuelScenarioSpec;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/** Detached calculation. An accidental transactional caller must not hold locks while simulating. */
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.NEVER)
public class DuelEvaluationService {

	private static final String EVALUATION_VERSION = "duel-evaluation-v1";
	private final SimulationService simulationService;
	private final Clock clock;

	public DuelResultResponse evaluate(DuelEvaluationWork work) {
		var market = work.market();
		var scenario = work.scenario();
		if (market.schemaVersion() != 1 || !DuelMarketSpec.VALUATION_VERSION.equals(market.valuationVersion())
				|| market.baseAmount().compareTo(DuelMarketSpec.BASE_AMOUNT) != 0
				|| market.durationDays() != scenario.durationDays() || work.players().size() != 2
				|| work.players().getFirst().userId().equals(work.players().getLast().userId())) {
			throw new IllegalStateException("Unsupported or inconsistent Duel evaluation inputs");
		}
		var whitelist = scenario.instruments().stream().map(DuelScenarioSpec.AllowedInstrument::id).collect(Collectors.toSet());
		var marketIds = market.instruments().stream().map(instrument -> instrument.instrumentId()).collect(Collectors.toSet());
		if (!whitelist.equals(marketIds) || marketIds.size() != market.instruments().size()
				|| market.instruments().stream().anyMatch(instrument -> !scenario.currency().equals(instrument.currency()))) {
			throw new IllegalStateException("Frozen market differs from the Duel whitelist/currency");
		}
		var heldIds = work.players().stream().flatMap(player -> player.allocations().stream())
				.map(DuelEvaluationWork.Allocation::instrumentId).collect(Collectors.toSet());
		if (!whitelist.containsAll(heldIds)) {
			throw new IllegalStateException("A locked portfolio contains an instrument outside the Duel whitelist");
		}
		var definitions = market.instruments().stream().filter(instrument -> heldIds.contains(instrument.instrumentId()))
				.sorted(Comparator.comparing(instrument -> instrument.instrumentId())).toList();
		var paths = simulationService.simulateFrozen(definitions, market.startDate(), market.durationDays(), market.baseAmount(), market.seed());
		var byId = paths.stream().collect(Collectors.toMap(SimulationResult::instrumentId, Function.identity()));
		var players = work.players().stream().sorted(Comparator.comparingInt(DuelEvaluationWork.Player::seat))
				.map(player -> value(player, scenario, market, byId)).toList();
		var a = players.getFirst();
		var b = players.getLast();
		int comparison = a.finalValue().compareTo(b.finalValue());
		Long winner = comparison == 0 ? null : comparison > 0 ? a.userId() : b.userId();
		var gap = a.finalValue().subtract(b.finalValue()).abs();
		return new DuelResultResponse(1, work.matchId(), clock.instant(), EVALUATION_VERSION, market.valuationVersion(),
				scenario.currency(), scenario.budget(), market.startDate(), market.startDate().plusDays(market.durationDays()),
				paths.getFirst().points().stream().map(point -> point.date()).toList(),
				winner == null ? DuelOutcome.DRAW : DuelOutcome.WIN, winner, gap,
				gap.multiply(BigDecimal.valueOf(100)).divide(scenario.budget(), 8, RoundingMode.HALF_EVEN), players);
	}

	private static DuelResultResponse.PlayerResult value(DuelEvaluationWork.Player player, DuelScenarioSpec scenario,
			DuelMarketSpec market, Map<Long, SimulationResult> paths) {
		var names = scenario.instruments().stream().collect(Collectors.toMap(DuelScenarioSpec.AllowedInstrument::id,
				DuelScenarioSpec.AllowedInstrument::name));
		var ids = new HashSet<Long>();
		var invested = new BigDecimal("0.00");
		var instruments = new ArrayList<DuelResultResponse.InstrumentResult>();
		for (var allocation : player.allocations().stream().sorted(Comparator.comparing(DuelEvaluationWork.Allocation::instrumentId)).toList()) {
			var amount = allocation.amount();
			if (!ids.add(allocation.instrumentId()) || amount == null || amount.signum() <= 0 || amount.stripTrailingZeros().scale() > 2) {
				throw new IllegalStateException("Invalid locked Duel allocation");
			}
			invested = invested.add(amount);
			var values = paths.get(allocation.instrumentId()).points().stream()
					.map(point -> amount.multiply(point.investmentValue()).divide(market.baseAmount(), 2, RoundingMode.HALF_EVEN)).toList();
			var finalValue = values.getLast();
			instruments.add(new DuelResultResponse.InstrumentResult(allocation.instrumentId(), names.get(allocation.instrumentId()),
					amount, values, finalValue, finalValue.subtract(amount)));
		}
		if (instruments.isEmpty() || invested.compareTo(scenario.budget()) > 0) {
			throw new IllegalStateException("Locked Duel portfolio is empty or over budget");
		}
		var cash = scenario.budget().subtract(invested);
		var values = new ArrayList<BigDecimal>();
		var peak = scenario.budget();
		var largestDrop = BigDecimal.ZERO.setScale(8);
		for (int index = 0; index < instruments.getFirst().values().size(); index++) {
			var total = cash;
			for (var instrument : instruments) {
				total = total.add(instrument.values().get(index));
			}
			values.add(total);
			peak = peak.max(total);
			largestDrop = largestDrop.max(peak.subtract(total).divide(peak, 8, RoundingMode.HALF_EVEN));
		}
		var finalValue = values.getLast();
		var profit = finalValue.subtract(scenario.budget());
		return new DuelResultResponse.PlayerResult(player.userId(), player.username(), player.seat(), cash, invested,
				instruments, values, finalValue, profit, profit.divide(scenario.budget(), 8, RoundingMode.HALF_EVEN), largestDrop);
	}
}
