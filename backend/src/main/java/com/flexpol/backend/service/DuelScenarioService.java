package com.flexpol.backend.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.random.RandomGenerator;
import java.util.stream.Collectors;

import com.flexpol.backend.dto.InstrumentResponse;
import com.flexpol.backend.model.DuelScenarioSpec;
import com.flexpol.backend.model.enums.AssetClass;
import com.flexpol.backend.simulation.SimulationEngine;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/** Generates public briefs, not markets. A future match must persist and reuse the returned snapshot. */
@Service
@Transactional(readOnly = true)
public class DuelScenarioService {

	private static final int MAX_DURATION_DAYS = 3650;
	private static final BigDecimal MAX_BUDGET = new BigDecimal("1000000000000");
	private static final Set<AssetClass> CATEGORIES = Set.of(AssetClass.STOCK, AssetClass.EQUITY_ETF);

	private final InstrumentService instrumentService;
	private final Map<String, SimulationEngine> engines;
	private final Templates templates;

	public DuelScenarioService(InstrumentService instrumentService, List<SimulationEngine> engines,
			JsonMapper jsonMapper, @Value("classpath:duel-scenarios.json") Resource resource) {
		this.instrumentService = instrumentService;
		this.engines = engines.stream().collect(Collectors.toUnmodifiableMap(SimulationEngine::modelKey, Function.identity()));
		try (var input = resource.getInputStream()) {
			this.templates = jsonMapper.readerFor(Templates.class)
					.with(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
					.without(DeserializationFeature.ACCEPT_FLOAT_AS_INT).readValue(input);
		} catch (IOException | tools.jackson.core.JacksonException error) {
			throw new IllegalStateException("Cannot read duel-scenarios.json: " + error.getMessage(), error);
		}
		validateTemplates(templates);
	}

	public DuelScenarioSpec generate() {
		// This randomness selects visible content only. Never reuse it as a hidden match-market seed.
		return generate(ThreadLocalRandom.current());
	}

	/** Package-private deterministic selection for service tests; never a client-controlled seed. */
	DuelScenarioSpec generate(RandomGenerator random) {
		var catalogue = instrumentService.getInstruments();
		var eligible = catalogue.stream()
				.filter(instrument -> templates.currency().equals(instrument.currency()))
				.filter(instrument -> templates.templates().stream().anyMatch(template -> template.category() == instrument.assetClass()))
				.filter(this::hasSupportedConfiguration)
				.sorted(Comparator.comparing(InstrumentResponse::id))
				.toList();
		// A broken supported model is a configuration error, never a silent category substitution.
		for (var instrument : eligible) {
			var configuration = instrument.simulationConfiguration();
			try {
				engines.get(configuration.modelKey()).validateParameters(configuration.parameters());
			} catch (IllegalStateException error) {
				throw new IllegalStateException("Invalid Duel simulation configuration for instrument " + instrument.id()
						+ ": " + error.getMessage(), error);
			}
		}
		var available = templates.templates().stream()
				.filter(template -> eligible.stream().filter(instrument -> instrument.assetClass() == template.category()).count() >= 2)
				.toList();
		if (available.isEmpty()) {
			throw new IllegalStateException("No valid Duel scenario: each configured category needs at least two EUR instruments with a supported simulation configuration");
		}
		var template = available.get(random.nextInt(available.size()));
		var option = template.options().get(random.nextInt(template.options().size()));
		var instruments = eligible.stream().filter(instrument -> instrument.assetClass() == template.category())
				.map(instrument -> new DuelScenarioSpec.AllowedInstrument(instrument.id(), instrument.name(),
						instrument.description(), instrument.assetClass(), instrument.currency(), instrument.riskLevel()))
				.toList();
		return new DuelScenarioSpec(templates.schemaVersion(), template.id(), template.version(), template.title(),
				template.background(), template.objective(), templates.currency(), option.budget().setScale(2),
				option.durationDays(), template.category(), template.categoryLabel(), instruments,
				templates.rules(), templates.disclaimer());
	}

	private boolean hasSupportedConfiguration(InstrumentResponse instrument) {
		var configuration = instrument.simulationConfiguration();
		return configuration != null && configuration.modelKey() != null && engines.containsKey(configuration.modelKey());
	}

	private static void validateTemplates(Templates data) {
		require(data != null && Integer.valueOf(1).equals(data.schemaVersion()), "schemaVersion must be 1");
		require("EUR".equals(data.currency()), "currency must be EUR");
		requireText(data.disclaimer(), "disclaimer");
		require(data.rules() != null && !data.rules().isEmpty(), "rules must not be empty");
		data.rules().forEach(rule -> requireText(rule, "rule"));
		require(data.templates() != null && !data.templates().isEmpty(), "templates must not be empty");
		var ids = new HashSet<String>();
		for (var template : data.templates()) {
			require(template != null, "template must not be null");
			require(template.id() != null && template.id().matches("[a-z0-9]+(?:-[a-z0-9]+)*"), "template id must be a nonempty kebab-case key");
			require(ids.add(template.id()), "duplicate template id: " + template.id());
			var where = "template " + template.id() + ": ";
			require(template.version() != null && template.version() > 0, where + "version must be positive");
			requireText(template.title(), where + "title");
			requireText(template.background(), where + "background");
			requireText(template.objective(), where + "objective");
			require(template.category() != null && CATEGORIES.contains(template.category()), where + "category must be STOCK or EQUITY_ETF");
			requireText(template.categoryLabel(), where + "categoryLabel");
			require(template.options() != null && !template.options().isEmpty(), where + "options must not be empty");
			var options = new HashSet<Option>();
			for (var option : template.options()) {
				require(option != null, where + "option must not be null");
				require(option.budget() != null && option.budget().signum() > 0
						&& option.budget().compareTo(MAX_BUDGET) <= 0
						&& option.budget().stripTrailingZeros().scale() <= 2,
						where + "budget must be positive whole cents, at most " + MAX_BUDGET);
				require(option.durationDays() != null && option.durationDays() >= 1 && option.durationDays() <= MAX_DURATION_DAYS,
						where + "durationDays must be between 1 and " + MAX_DURATION_DAYS);
				require(options.add(new Option(option.budget().setScale(2), option.durationDays())), where + "duplicate budget/horizon option");
			}
		}
	}

	private static void requireText(String value, String field) {
		require(value != null && !value.isBlank(), field + " must not be blank");
	}

	private static void require(boolean valid, String message) {
		if (!valid) {
			throw new IllegalStateException("Invalid duel-scenarios.json: " + message);
		}
	}

	/** Classpath content only, never deserialized from a learner request. */
	public record Templates(Integer schemaVersion, String currency, String disclaimer, List<String> rules, List<Template> templates) {
	}

	public record Template(String id, Integer version, String title, String background, String objective,
			AssetClass category, String categoryLabel, List<Option> options) {
	}

	public record Option(BigDecimal budget, Integer durationDays) {
	}
}
