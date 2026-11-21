package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.flexpol.backend.dto.ScenarioResponse;
import com.flexpol.backend.entity.ScenarioRuleType;
import com.flexpol.backend.exception.ResourceNotFoundException;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Checks the scenarios seeded from knowledge/sandbox-scenarios.json. */
@SpringBootTest
class ScenarioServiceTests {

	@Autowired
	private ScenarioService scenarioService;

	@Test
	void listsSeededScenariosInJsonOrderWithTheirBrief() {
		var scenarios = scenarioService.getScenarios();

		assertThat(scenarios).extracting(ScenarioResponse::code).containsExactly("2.3", "2.6", "3.3", "3.5");

		var henryk = scenarios.getLast();
		assertThat(henryk.slug()).isEqualTo("henryk-retires-next-year");
		assertThat(henryk.chapterNumber()).isEqualTo(3);
		assertThat(henryk.budget()).isEqualByComparingTo("400000");
		assertThat(henryk.durationDays()).isEqualTo(1095);
		assertThat(henryk.instruments()).extracting(ScenarioResponse.AllowedInstrument::id)
				.containsExactly(1013L, 1015L, 1017L, 1018L);
		assertThat(henryk.moneyNeeds()).extracting(ScenarioResponse.MoneyNeed::day).containsExactly(365, 730);
		assertThat(henryk.moneyNeeds()).allSatisfy(need -> assertThat(need.amount()).isEqualByComparingTo("32000"));
		assertThat(henryk.moneyNeeds().getFirst().label()).isEqualTo("First year of spending");
		assertThat(henryk.lessons()).extracting(lesson -> lesson.code()).containsExactly("3.4");
		assertThat(henryk.scoring().maxDrawdown()).isEqualByComparingTo("0.08");
	}

	@Test
	void rulesKeepTheirTypeAndInstruments() {
		var sam = scenarioService.getScenarios().stream()
				.filter(scenario -> scenario.code().equals("3.3"))
				.findFirst()
				.orElseThrow();

		assertThat(sam.rules()).singleElement().satisfies(rule -> {
			assertThat(rule.type()).isEqualTo(ScenarioRuleType.MAX_TOTAL_SHARE);
			assertThat(rule.maxShare()).isEqualByComparingTo("0.2");
			assertThat(rule.instrumentIds()).containsExactly(1002L, 1012L);
		});
	}

	@Test
	void unknownScenarioIsNotFound() {
		assertThatThrownBy(() -> scenarioService.getScenario(999L)).isInstanceOf(ResourceNotFoundException.class);
	}
}
