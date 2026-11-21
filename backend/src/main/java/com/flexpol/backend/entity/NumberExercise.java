package com.flexpol.backend.entity;

import java.math.BigDecimal;

/** A number to find by calculation or by experimenting with a slider. */
public record NumberExercise(String label, String unit, BigDecimal answer, String hint, Lab lab, Dial dial) {
	public record Dial(int max, int step) {}

	public record Lab(Kind kind, int max, int step, int initial, int balance, Integer rate, Integer bill) {
		public enum Kind { COMPOUNDING, LOCKBOX, SHOCK }
	}
}
