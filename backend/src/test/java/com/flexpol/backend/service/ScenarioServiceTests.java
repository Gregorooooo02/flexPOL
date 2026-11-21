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

		assertThat(scenarios).extracting(ScenarioResponse::code).containsExactly(
				"2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6");

		var kuba = scenarios.getFirst();
		assertThat(kuba.slug()).isEqualTo("kuba-safety-cushion");
		assertThat(kuba.chapterNumber()).isEqualTo(2);
		assertThat(kuba.budget()).isEqualByComparingTo("6000");
		assertThat(kuba.durationDays()).isEqualTo(365);
		assertThat(kuba.instruments()).extracting(ScenarioResponse.AllowedInstrument::id)
				.containsExactly(1013L, 1015L, 1001L, 1010L);
		assertThat(kuba.moneyNeeds()).singleElement().satisfies(need -> {
			assertThat(need.day()).isEqualTo(120);
			assertThat(need.amount()).isEqualByComparingTo("2500");
			assertThat(need.label()).isEqualTo("Car repair");
		});
		assertThat(kuba.lessons()).extracting(lesson -> lesson.code()).containsExactly("2.1");
		assertThat(kuba.scoring().maxDrawdown()).isEqualByComparingTo("0.04");
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
