package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;

import com.flexpol.backend.dto.ScenarioResponse;
import com.flexpol.backend.dto.ScenarioRunRequest;
import com.flexpol.backend.dto.ScenarioRunRequest.Allocation;
import com.flexpol.backend.exception.BadRequestException;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** The scenario text for the coach, on the seeded 3.5 Henryk (€400,000, €32,000 of spending on days 365 and 730) and 2.3 Marek. */
@SpringBootTest
class CoachScenarioContextServiceTests {

	@Autowired
	private CoachScenarioContextService contextService;

	@Autowired
	private ScenarioService scenarioService;

	@Autowired
	private ScenarioRunService scenarioRunService;

	@Test
	void beforeARunShowsTheBriefAndPlanButNothingTheLearnerHasNotSeen() {
		Long henryk = idOf("3.5");
		var spec = scenarioService.getRunSpec(henryk);

		String text = contextService.scenarioContext(henryk, List.of(new Allocation(1013L, new BigDecimal("80000.00"))), false);

		assertThat(text).contains("Scenario 3.5", spec.brief().goal(), "Budget: €400,000.00")
				.contains("Day 365: €32,000.00", "Day 730: €32,000.00")
				.contains(": €80,000.00 (20%)", "- Cash: €320,000.00 (80%)")
				.contains("have not seen a result")
				.doesNotContain(spec.evaluation().explanation())
				.doesNotContain("Suitable here", "Final value:");
		spec.debriefPoints().forEach(point -> assertThat(text).doesNotContain(point));
	}

	@Test
	void afterARunGivesTheServersResultStarsAndDebriefPoints() {
		Long marek = idOf("2.3");
		var spec = scenarioService.getRunSpec(marek);
		// €25,000: 20% in ASML (1010) breaks the 10% single-stock rule; 60% in the world fund (1013), 20% cash.
		var allocations = List.of(
				new Allocation(1010L, new BigDecimal("5000.00")),
				new Allocation(1013L, new BigDecimal("15000.00")));
		var run = scenarioRunService.run(marek, new ScenarioRunRequest(allocations));

		String text = contextService.scenarioContext(marek, allocations, true);

		assertThat(run.score().brokenRules()).isNotEmpty();
		assertThat(text).contains("Rule \"" + run.score().brokenRules().getFirst() + "\": broken.")
				.contains(String.format(java.util.Locale.ROOT, "Final value: €%,.2f", run.finalValue()))
				.contains("Stars: " + run.stars().stars() + " of 5.")
				.contains("Favourite stock (ASML)", "outside")
				.contains(spec.evaluation().explanation())
				.contains("Change plan");
		spec.debriefPoints().forEach(point -> assertThat(text).contains(point));
	}

	@Test
	void rejectsAPlanOutsideTheScenarioAndARunWithoutAPlan() {
		Long henryk = idOf("3.5");

		assertThatThrownBy(() -> contextService.scenarioContext(henryk, List.of(new Allocation(9999L, BigDecimal.TEN)), false))
				.isInstanceOf(BadRequestException.class);
		assertThatThrownBy(() -> contextService.scenarioContext(henryk, null, true))
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
