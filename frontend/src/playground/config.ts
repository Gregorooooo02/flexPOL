/** Fixed settings of the Playground. */

/** Starting cash: €10,000, in cents. */
export const STARTING_BUDGET_CENTS = 1_000_000;

/** Every simulated series starts at this value, so a price is `value / TAPE_BASE_VALUE`. */
export const TAPE_BASE_VALUE = 10_000;

export interface Horizon {
  readonly years: number;
  /** Elapsed calendar days sent to the simulation. 3,650 is the batch endpoint's maximum. */
  readonly days: number;
}

export const HORIZONS: readonly Horizon[] = [
  { years: 1, days: 365 },
  { years: 3, days: 1095 },
  { years: 5, days: 1825 },
  { years: 10, days: 3650 },
];

export const DEFAULT_HORIZON_YEARS = 5;

/** Every selected investment horizon plays from start to finish in ten real seconds. */
export const SIMULATION_DURATION_MS = 10_000;
