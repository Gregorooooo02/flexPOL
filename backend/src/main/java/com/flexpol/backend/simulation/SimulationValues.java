package com.flexpol.backend.simulation;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/** Numeric conversion at engine boundaries; configuration errors are not request errors. */
final class SimulationValues {

	private SimulationValues() {
	}

	static BigDecimal decimalParameter(Map<String, Object> parameters, String name) {
		if (parameters == null) {
			throw new IllegalStateException("Simulation parameters must be an object");
		}
		Object value = parameters.get(name);
		if (!(value instanceof Number)) {
			throw new IllegalStateException("Missing or non-numeric simulation parameter: " + name);
		}
		try {
			return new BigDecimal(value.toString());
		} catch (NumberFormatException error) {
			throw new IllegalStateException("Non-finite simulation parameter: " + name, error);
		}
	}

	static int integerParameter(Map<String, Object> parameters, String name) {
		try {
			return decimalParameter(parameters, name).intValueExact();
		} catch (ArithmeticException error) {
			throw new IllegalStateException("Simulation parameter must be an integer: " + name, error);
		}
	}

	static BigDecimal money(double value) {
		if (!Double.isFinite(value) || value < 0) {
			throw new IllegalStateException("Simulation produced a non-finite or negative investment value");
		}
		return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_EVEN);
	}
}
