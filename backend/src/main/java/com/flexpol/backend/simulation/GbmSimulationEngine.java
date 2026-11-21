package com.flexpol.backend.simulation;

import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

import com.flexpol.backend.model.GbmParameters;
import com.flexpol.backend.model.SimulationContext;
import com.flexpol.backend.model.SimulationPoint;
import com.flexpol.backend.model.SimulationTrajectory;

import org.springframework.stereotype.Component;

@Component
public class GbmSimulationEngine implements SimulationEngine {

	@Override
	public String modelKey() {
		return "GBM";
	}

	@Override
	public String modelVersion() {
		return "gbm-v1";
	}

	@Override
	public void validateParameters(Map<String, Object> parameters) {
		parameters(parameters);
	}

	private static GbmParameters parameters(Map<String, Object> values) {
		var parameters = new GbmParameters(
				SimulationValues.decimalParameter(values, "annualExpectedReturn"),
				SimulationValues.decimalParameter(values, "annualVolatility"),
				SimulationValues.integerParameter(values, "periodsPerYear"));
		double mu = parameters.annualExpectedReturn().doubleValue();
		double sigma = parameters.annualVolatility().doubleValue();
		if (!Double.isFinite(mu) || !Double.isFinite(sigma) || sigma < 0 || parameters.periodsPerYear() <= 0) {
			throw new IllegalStateException("Invalid GBM return, volatility, or periods per year");
		}
		return parameters;
	}

	@Override
	public SimulationTrajectory simulate(SimulationContext context) {
		if (context.endDate().isBefore(context.startDate())) {
			throw new IllegalArgumentException("Simulation end date must not precede its start date");
		}
		var parameters = parameters(context.parameters());
		double mu = parameters.annualExpectedReturn().doubleValue();
		double sigma = parameters.annualVolatility().doubleValue();

		double dt = 1.0 / parameters.periodsPerYear();
		double value = context.initialInvestment().doubleValue();
		var random = new Random(context.randomSeed());
		List<SimulationPoint> points = new ArrayList<>();
		points.add(new SimulationPoint(context.startDate(), context.initialInvestment().setScale(2, RoundingMode.HALF_EVEN)));
		for (var day = context.startDate().plusDays(1); !day.isAfter(context.endDate()); day = day.plusDays(1)) {
			if (day.getDayOfWeek() == DayOfWeek.SATURDAY || day.getDayOfWeek() == DayOfWeek.SUNDAY) {
				continue;
			}
			value *= Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * random.nextGaussian());
			points.add(new SimulationPoint(day, SimulationValues.money(value)));
		}
		if (!points.getLast().date().equals(context.endDate())) {
			points.add(new SimulationPoint(context.endDate(), points.getLast().investmentValue()));
		}
		return new SimulationTrajectory(context.endDate(), List.copyOf(points));
	}
}
