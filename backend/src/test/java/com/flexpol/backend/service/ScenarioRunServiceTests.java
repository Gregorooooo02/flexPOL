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

/** Runs allocations through the seeded scenarios: 2.1 Kuba (€6,000, €2,500 repair on day 120) and 2.3 Marek. */
@SpringBootTest
class ScenarioRunServiceTests {

	@Autowired
	private ScenarioRunService scenarioRunService;

	@Autowired
	private ScenarioService scenarioService;

	@Test
	void allCashPaysTheNeedFromCashWithNoDropAndMeetsTheGoal() {
		var run = scenarioRunService.run(idOf("2.1"), new ScenarioRunRequest(List.of()));

		assertThat(run.instruments()).isEmpty();
		assertThat(run.points().getFirst().value()).isEqualByComparingTo("6000");
		assertThat(run.finalValue()).isEqualByComparingTo("3500");
		assertThat(run.paidOut()).isEqualByComparingTo("2500");
		assertThat(run.totalReturn()).isEqualByComparingTo("0");
		assertThat(run.largestDrop()).isEqualByComparingTo("0");
		assertThat(run.moneyNeeds()).singleElement().satisfies(need -> {
			assertThat(need.paidFromCash()).isEqualByComparingTo("2500");
			assertThat(need.paidFromHoldings()).isEqualByComparingTo("0");
			assertThat(need.shortfall()).isEqualByComparingTo("0");
			assertThat(need.date()).isEqualTo(run.points().get(need.pointIndex()).date());
		});
		assertThat(run.goalMet()).isTrue();
		assertThat(run.score().total()).isEqualTo(100);
		// No growth (cash earns 0%), but the goal, the instruments (none needed) and the cash share fit.
		assertThat(run.stars().criteria()).extracting(StarCriterion::earned).containsExactly(false, true, true, true);
		assertThat(run.stars().stars()).isEqualTo(3);
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
		var request = new ScenarioRunRequest(List.of(new Allocation(1013L, new BigDecimal("6000.00"))));

		var first = scenarioRunService.run(idOf("2.1"), request);
		var second = scenarioRunService.run(idOf("2.1"), request);

		assertThat(second.points()).isEqualTo(first.points());
		assertThat(first.moneyNeeds()).singleElement().satisfies(need -> {
			assertThat(need.paidFromCash()).isEqualByComparingTo("0");
			assertThat(need.paidFromHoldings()).isEqualByComparingTo("2500");
		});
		var fund = first.instruments().getFirst();
		assertThat(fund.values()).hasSameSizeAs(first.points());
		assertThat(fund.values().getFirst()).isEqualByComparingTo("6000");
		// No cash: the portfolio is the fund, and its contribution is what it made on top of the €6,000.
		assertThat(first.finalValue()).isEqualByComparingTo(fund.finalValue());
		assertThat(fund.contribution()).isEqualByComparingTo(first.finalValue().add(first.paidOut()).subtract(new BigDecimal("6000")));
		// The seeded evaluation: the world fund suits Kuba, but no cash at all is outside the 70–100% range.
		assertThat(first.stars().unsuitableInstrumentIds()).isEmpty();
		assertThat(first.stars().shareRanges()).singleElement().satisfies(range -> {
			assertThat(range.label()).isEqualTo("Cash");
			assertThat(range.share()).isEqualByComparingTo("0");
			assertThat(range.met()).isFalse();
		});
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
		Long kuba = idOf("2.1");

		assertThatThrownBy(() -> scenarioRunService.run(kuba, new ScenarioRunRequest(List.of(
				new Allocation(1020L, new BigDecimal("100"))))))
				.isInstanceOf(BadRequestException.class);
		assertThatThrownBy(() -> scenarioRunService.run(kuba, new ScenarioRunRequest(List.of(
				new Allocation(1013L, new BigDecimal("3000")),
				new Allocation(1015L, new BigDecimal("3000.01"))))))
				.isInstanceOf(BadRequestException.class);
		assertThatThrownBy(() -> scenarioRunService.run(kuba, new ScenarioRunRequest(List.of(
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
