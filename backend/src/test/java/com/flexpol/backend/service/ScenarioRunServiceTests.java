package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.flexpol.backend.dto.ScenarioResponse;
import com.flexpol.backend.dto.ScenarioRunRequest;
import com.flexpol.backend.dto.ScenarioRunRequest.Allocation;
import com.flexpol.backend.dto.ScenarioRunResponse.ShareRangeResult;
import com.flexpol.backend.dto.ScenarioRunResponse.StarCriterion;
import com.flexpol.backend.exception.BadRequestException;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Runs allocations through the seeded scenarios: 3.5 Henryk (€400,000, €32,000 of spending on days 365 and 730,
 * target €340,000) and 2.3 Marek.
 */
@SpringBootTest
class ScenarioRunServiceTests {

	@Autowired
	private ScenarioRunService scenarioRunService;

	@Autowired
	private ScenarioService scenarioService;

	@Test
	void allCashPaysBothNeedsFromCashButEarnsOnlyTheMinimumStar() {
		var run = scenarioRunService.run(idOf("3.5"), new ScenarioRunRequest(List.of()));

		assertThat(run.instruments()).isEmpty();
		assertThat(run.points().getFirst().value()).isEqualByComparingTo("400000");
		assertThat(run.finalValue()).isEqualByComparingTo("336000");
		assertThat(run.paidOut()).isEqualByComparingTo("64000");
		assertThat(run.totalReturn()).isEqualByComparingTo("0");
		assertThat(run.largestDrop()).isEqualByComparingTo("0");
		assertThat(run.moneyNeeds()).hasSize(2).allSatisfy(need -> {
			assertThat(need.paidFromCash()).isEqualByComparingTo("32000");
			assertThat(need.paidFromHoldings()).isEqualByComparingTo("0");
			assertThat(need.shortfall()).isEqualByComparingTo("0");
			assertThat(need.date()).isEqualTo(run.points().get(need.pointIndex()).date());
		});
		assertThat(run.goalMet()).isFalse();
		// Growth 100 × (336,000 − 310,000) / (340,000 − 310,000) ≈ 87 at weight 0.3, stability 100 at weight 0.7.
		assertThat(run.score().growth()).isEqualTo(87);
		assertThat(run.score().stability()).isEqualTo(100);
		assertThat(run.score().total()).isEqualTo(96);
		// The stars don't reward doing nothing: no growth, no goal, no fund (at least one is needed) and too much cash.
		assertThat(run.stars().criteria()).extracting(StarCriterion::earned).containsExactly(false, false, false, false);
		assertThat(run.stars().earned()).isZero();
		assertThat(run.stars().stars()).isEqualTo(1);
	}

	@Test
	void starsJudgeInstrumentsAndSharesExactlyAndNeverDropBelowOne() {
		var evaluation = new ScenarioRunSpec.Evaluation(List.of(1013L), 1, List.of(
				new ScenarioRunSpec.ShareRange("Cash", true, false, List.of(), new BigDecimal("0.7"), BigDecimal.ONE),
				new ScenarioRunSpec.ShareRange("Any single fund", false, true, List.of(1013L, 1015L), BigDecimal.ZERO, new BigDecimal("0.3"))),
				"Why");
		var budget = new BigDecimal("6000.00");

		// Exactly 70% cash and 30% in one fund is inside both ranges.
		var atLimit = ScenarioRunService.stars(evaluation, Map.of(1013L, new BigDecimal("1800.00")), budget, true, false);
		assertThat(atLimit.criteria()).extracting(StarCriterion::earned).containsExactly(true, false, true, true);
		assertThat(atLimit.stars()).isEqualTo(4);
		assertThat(atLimit.shareRanges()).extracting(ShareRangeResult::share)
				.usingElementComparator(BigDecimal::compareTo).containsExactly(new BigDecimal("0.7"), new BigDecimal("0.3"));

		// One cent more invested breaks both ranges.
		var overLimit = ScenarioRunService.stars(evaluation, Map.of(1013L, new BigDecimal("1800.01")), budget, true, false);
		assertThat(overLimit.shareRanges()).extracting(ShareRangeResult::met).containsExactly(false, false);

		// Only an unsuitable instrument, no growth, no goal: nothing earned, still one star.
		var nothing = ScenarioRunService.stars(evaluation, Map.of(1015L, budget), budget, false, false);
		assertThat(nothing.unsuitableInstrumentIds()).containsExactly(1015L);
		assertThat(nothing.earned()).isZero();
		assertThat(nothing.stars()).isEqualTo(1);
	}

	@Test
	void theScenarioSeedGivesEveryRunTheSameMarketAndNeedsAreSoldFromHoldings() {
		var request = new ScenarioRunRequest(List.of(new Allocation(1013L, new BigDecimal("400000.00"))));

		var first = scenarioRunService.run(idOf("3.5"), request);
		var second = scenarioRunService.run(idOf("3.5"), request);

		assertThat(second.points()).isEqualTo(first.points());
		assertThat(first.moneyNeeds()).hasSize(2).allSatisfy(need -> {
			assertThat(need.paidFromCash()).isEqualByComparingTo("0");
			assertThat(need.paidFromHoldings()).isEqualByComparingTo("32000");
		});
		var fund = first.instruments().getFirst();
		assertThat(fund.values()).hasSameSizeAs(first.points());
		assertThat(fund.values().getFirst()).isEqualByComparingTo("400000");
		// No cash: the portfolio is the fund, and its contribution is what it made on top of the €400,000.
		assertThat(first.finalValue()).isEqualByComparingTo(fund.finalValue());
		assertThat(fund.contribution()).isEqualByComparingTo(first.finalValue().add(first.paidOut()).subtract(new BigDecimal("400000")));
		// The seeded evaluation: the world fund suits Henryk, but no cash is below the 25–60% range
		// and 100% in one fund is above the 30% cap on each fund.
		assertThat(first.stars().unsuitableInstrumentIds()).isEmpty();
		assertThat(first.stars().shareRanges()).extracting(ShareRangeResult::label).containsExactly("Cash", "Any single fund");
		assertThat(first.stars().shareRanges()).extracting(ShareRangeResult::share)
				.usingElementComparator(BigDecimal::compareTo).containsExactly(BigDecimal.ZERO, BigDecimal.ONE);
		assertThat(first.stars().shareRanges()).extracting(ShareRangeResult::met).containsExactly(false, false);
		assertThat(first.stars().explanation()).isNotBlank();
	}

	@Test
	void aShareAboveTheRuleLimitCostsPointsButTheLimitItselfDoesNot() {
		var run = scenarioRunService.run(idOf("2.3"), new ScenarioRunRequest(List.of(
				new Allocation(1001L, new BigDecimal("2500.00")),
				new Allocation(1006L, new BigDecimal("2500.01")))));

		assertThat(run.score().brokenRules()).containsExactly("No single stock above 10%");
		assertThat(run.score().rulePenalty()).isEqualTo(15);
	}

	@Test
	void rejectsInstrumentsOutsideTheScenarioOverspendingAndFractionsOfCents() {
		Long henryk = idOf("3.5");

		assertThatThrownBy(() -> scenarioRunService.run(henryk, new ScenarioRunRequest(List.of(
				new Allocation(1020L, new BigDecimal("100"))))))
				.isInstanceOf(BadRequestException.class);
		assertThatThrownBy(() -> scenarioRunService.run(henryk, new ScenarioRunRequest(List.of(
				new Allocation(1013L, new BigDecimal("200000")),
				new Allocation(1015L, new BigDecimal("200000.01"))))))
				.isInstanceOf(BadRequestException.class);
		assertThatThrownBy(() -> scenarioRunService.run(henryk, new ScenarioRunRequest(List.of(
				new Allocation(1013L, new BigDecimal("100.001"))))))
				.isInstanceOf(BadRequestException.class);
	}

	private Long idOf(String code) {
		return scenarioService.getScenarios().stream()
				.filter(scenario -> scenario.code().equals(code))
				.map(ScenarioResponse::id)
				.findFirst()
				.orElseThrow();
	}
}
