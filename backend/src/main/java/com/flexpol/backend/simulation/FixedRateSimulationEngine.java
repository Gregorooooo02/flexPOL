package com.flexpol.backend.simulation;

import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import com.flexpol.backend.model.FixedRateParameters;
import com.flexpol.backend.model.SimulationContext;
import com.flexpol.backend.model.SimulationPoint;
import com.flexpol.backend.model.SimulationTrajectory;

import org.springframework.stereotype.Component;

@Component
public class FixedRateSimulationEngine implements SimulationEngine {

	@Override
	public String modelKey() {
		return "FIXED_RATE";
	}

	@Override
	public String modelVersion() {
		return "fixed-rate-v1";
	}

	@Override
	public SimulationTrajectory simulate(SimulationContext context) {
		if (context.endDate().isBefore(context.startDate())) {
			throw new IllegalArgumentException("Simulation end date must not precede its start date");
		}
		var parameters = new FixedRateParameters(
				SimulationValues.decimalParameter(context.parameters(), "annualNominalRate"),
				SimulationValues.integerParameter(context.parameters(), "compoundsPerYear"),
				SimulationValues.integerParameter(context.parameters(), "termMonths"),
				context.parameters().get("maturityPolicy") instanceof String policy ? policy : null);
		double rate = parameters.annualNominalRate().doubleValue();
		if (!Double.isFinite(rate) || parameters.compoundsPerYear() <= 0 || parameters.termMonths() <= 0
				|| 1 + rate / parameters.compoundsPerYear() <= 0 || !"STOP".equals(parameters.maturityPolicy())) {
			throw new IllegalStateException("Invalid fixed-rate parameters; only STOP maturity policy is supported");
		}
		var maturity = context.startDate().plusMonths(parameters.termMonths());
		var end = context.endDate().isAfter(maturity) ? maturity : context.endDate();
		List<SimulationPoint> points = new ArrayList<>();
		points.add(new SimulationPoint(context.startDate(), context.initialInvestment().setScale(2, RoundingMode.HALF_EVEN)));
		for (var day = context.startDate().plusDays(1); !day.isAfter(end); day = day.plusDays(1)) {
			long elapsedDays = ChronoUnit.DAYS.between(context.startDate(), day);
			double exponent = parameters.compoundsPerYear() * (elapsedDays / 365.0);
			double value = context.initialInvestment().doubleValue()
					* Math.pow(1 + rate / parameters.compoundsPerYear(), exponent);
			points.add(new SimulationPoint(day, SimulationValues.money(value)));
		}
		return new SimulationTrajectory(end, List.copyOf(points));
	}
}
