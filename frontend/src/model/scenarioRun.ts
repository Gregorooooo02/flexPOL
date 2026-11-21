// Mirrors backend DTOs: ScenarioRunRequest and ScenarioRunResponse (and their nested records).
// Money is in the scenario's currency (EUR) as JSON numbers with cents; drops and returns are fractions.

/** `amount` in euros, whole cents. Unallocated money stays as cash; an empty list means all cash. */
export interface ScenarioAllocation {
  instrumentId: number;
  amount: number;
}

export interface ScenarioRunRequest {
  allocations: ScenarioAllocation[];
}

/** Cash plus holdings on one date, after the money needs paid so far. */
export interface ScenarioRunPoint {
  date: string;
  value: number;
  cash: number;
}

/** One invested instrument; `values` follows `points` and shrinks when holdings pay a money need. */
export interface ScenarioInstrumentRun {
  instrumentId: number;
  amount: number;
  values: number[];
  finalValue: number;
  /** Final value plus what was sold for money needs, minus the amount invested. */
  contribution: number;
}

/** How a money need was paid, at `points[pointIndex]` (the first point on or after `day`). */
export interface ScenarioMoneyNeedRun {
  day: number;
  label: string;
  amount: number;
  date: string;
  pointIndex: number;
  paidFromCash: number;
  paidFromHoldings: number;
  shortfall: number;
}

/** 0–100: `growthWeight × growth + stabilityWeight × stability − rulePenalty`, clamped. */
export interface ScenarioScore {
  total: number;
  growth: number;
  stability: number;
  growthWeight: number;
  stabilityWeight: number;
  rulePenalty: number;
  brokenRules: string[];
}

/** Growth is worth two stars; goal, assets and shares one each. */
export type StarCriterionKey = 'GROWTH' | 'GOAL' | 'ASSETS' | 'SHARES';

export interface StarCriterion {
  key: StarCriterionKey;
  stars: number;
  earned: boolean;
}

/** A shares-star range with the learner's share; for an `each` range, `share` is the largest one. */
export interface ShareRangeResult {
  label: string;
  includesCash: boolean;
  each: boolean;
  instrumentIds: number[];
  min: number;
  max: number;
  share: number;
  met: boolean;
}

/**
 * 1–5 stars (`earned` is the plain 0–5 sum; `stars` never goes below one). The suitable
 * instruments, ranges and explanation only arrive with a result, never in the brief.
 */
export interface ScenarioStarRating {
  stars: number;
  earned: number;
  criteria: StarCriterion[];
  suitableInstrumentIds: number[];
  minInstruments: number;
  unsuitableInstrumentIds: number[];
  shareRanges: ShareRangeResult[];
  explanation: string;
}

export interface ScenarioRunResponse {
  scenarioId: number;
  currency: string;
  budget: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  points: ScenarioRunPoint[];
  instruments: ScenarioInstrumentRun[];
  moneyNeeds: ScenarioMoneyNeedRun[];
  finalValue: number;
  paidOut: number;
  /** (final value + paid out − budget) / budget. */
  totalReturn: number;
  /** Largest drop of value plus money paid out, as a fraction. */
  largestDrop: number;
  /** No shortfall and the final value reached the scenario's target. */
  goalMet: boolean;
  /** The 0–100 plan score (knowledge/sandbox-scenarios.md §4); the UI shows `stars`. */
  score: ScenarioScore;
  stars: ScenarioStarRating;
}
