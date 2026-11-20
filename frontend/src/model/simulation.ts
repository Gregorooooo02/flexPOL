// Mirrors backend DTOs: SimulationRequest, SimulationResult, SimulationPoint.
// Dates are ISO `LocalDate` strings; money is in the instrument's currency (EUR).

export interface SimulationRequest {
  instrumentId: number;
  initialInvestment: number;
  /** Elapsed calendar days. */
  durationDays: number;
  /** Omit to get a generated seed. The same seed on several batch items gives identical shocks. */
  randomSeed?: number | null;
}

/** A simulated investment amount on one date, not an index level. */
export interface SimulationPoint {
  date: string;
  investmentValue: number;
}

export interface SimulationResult {
  instrumentId: number;
  currency: string;
  initialInvestment: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  /** The seed actually used. */
  randomSeed: number;
  finalValue: number;
  /** A fraction: 0.10 means 10%. */
  totalReturn: number;
  points: SimulationPoint[];
}
