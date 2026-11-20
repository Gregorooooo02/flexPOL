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

export interface ReplaySpeed {
  readonly id: 'week' | 'month' | 'quarter';
  readonly label: string;
  /** Replay days are weekdays, so speeds are in trading days per second. */
  readonly tradingDaysPerSecond: number;
}

export const REPLAY_SPEEDS: readonly ReplaySpeed[] = [
  { id: 'week', label: '1 week/s', tradingDaysPerSecond: 5 },
  { id: 'month', label: '1 month/s', tradingDaysPerSecond: 21 },
  { id: 'quarter', label: '1 quarter/s', tradingDaysPerSecond: 63 },
];

export const DEFAULT_REPLAY_SPEED_ID: ReplaySpeed['id'] = 'month';
