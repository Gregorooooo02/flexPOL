package com.flexpol.backend.simulation;

/**
 * Derives an independent random seed per instrument from one master seed, so instruments in a
 * portfolio do not share the same random shocks (identical seeds would mean perfect correlation).
 * The result depends only on the master seed and the instrument ID, never on which other
 * instruments are simulated alongside it.
 */
public final class SeedMixer {

	/** Seeds stay below 2^53 so they survive a JSON round-trip through JavaScript. */
	private static final long SEED_MASK = (1L << 53) - 1;
	private static final long GAMMA = 0x9E3779B97F4A7C15L;

	private SeedMixer() {
	}

	/** SplitMix64 finalizer applied to the master seed offset by the instrument ID. */
	public static long derive(long masterSeed, long instrumentId) {
		long z = masterSeed + (instrumentId + 1) * GAMMA;
		z = (z ^ (z >>> 30)) * 0xBF58476D1CE4E5B9L;
		z = (z ^ (z >>> 27)) * 0x94D049BB133111EBL;
		z = z ^ (z >>> 31);
		return z & SEED_MASK;
	}
}
