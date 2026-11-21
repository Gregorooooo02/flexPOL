import type { AssetClass, RiskLevel } from './instrument';

// Mirrors DuelScenarioResponse. No simulation parameters or market seeds.
export interface DuelScenario {
  schemaVersion: number;
  templateId: string;
  templateVersion: number;
  title: string;
  background: string;
  objective: string;
  currency: 'EUR';
  budget: number;
  durationDays: number;
  category: 'STOCK' | 'EQUITY_ETF';
  categoryLabel: string;
  instruments: DuelAllowedInstrument[];
  rules: string[];
  disclaimer: string;
}

export interface DuelAllowedInstrument {
  id: number;
  name: string;
  description: string | null;
  assetClass: AssetClass;
  currency: string;
  riskLevel: RiskLevel;
}

export type DuelPhase = 'BRIEFING' | 'PLANNING' | 'EVALUATING' | 'EVALUATED' | 'REPLAY' | 'FINISHED' | 'CANCELLED' | 'FAILED';
export type DuelFailureReason = 'EVALUATION_ERROR' | 'EVALUATION_TIMEOUT';
export type DuelOutcome = 'WIN' | 'DRAW';
export type DuelSubmissionSource = 'MANUAL' | 'TIMEOUT';
export type DuelCancellationReason = 'EMPTY_PORTFOLIO';

export interface DuelAllocation {
  instrumentId: number;
  amount: number;
}

// Mirrors DuelPortfolioRequest; revisions are scoped to one participant's draft.
export interface DuelPortfolioRequest {
  expectedRevision: number;
  allocations: DuelAllocation[];
}

export interface DuelPlayer {
  userId: number;
  username: string;
  seat: number;
  submitted: boolean;
}

export interface DuelPortfolio {
  revision: number;
  allocations: DuelAllocation[];
  invested: number;
  cash: number;
  savedAt: string | null;
  submittedAt: string | null;
  submissionSource: DuelSubmissionSource | null;
}

// Mirrors DuelMatchResponse. The opponent's portfolio is intentionally absent.
export interface DuelMatch {
  id: string;
  phase: DuelPhase;
  revision: number;
  scenario: DuelScenario;
  createdAt: string;
  planningStartsAt: string;
  planningEndsAt: string;
  evaluationStartedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: DuelCancellationReason | null;
  evaluatedAt: string | null;
  failedAt: string | null;
  failureReason: DuelFailureReason | null;
  replayStartsAt: string | null;
  replayEndsAt: string | null;
  finishedAt: string | null;
  ratingFormulaVersion: string;
  serverNow: string;
  players: DuelPlayer[];
  ownPortfolio: DuelPortfolio;
}

// Mirrors DuelResultResponse: both portfolios are released only after evaluation.
export interface DuelResult {
  schemaVersion: number;
  matchId: string;
  completedAt: string;
  evaluationVersion: string;
  valuationVersion: string;
  currency: string;
  budget: number;
  startDate: string;
  endDate: string;
  dates: string[];
  outcome: DuelOutcome;
  winnerId: number | null;
  finalValueGap: number;
  returnDifferencePercentagePoints: number;
  players: DuelPlayerResult[];
}

export interface DuelPlayerResult {
  userId: number;
  username: string;
  seat: number;
  cash: number;
  invested: number;
  instruments: DuelInstrumentResult[];
  values: number[];
  finalValue: number;
  profit: number;
  /** Fraction, not a percentage. */
  totalReturn: number;
  /** Fraction, not a percentage. */
  maxDrawdown: number;
}

export interface DuelInstrumentResult {
  instrumentId: number;
  name: string;
  allocation: number;
  values: number[];
  finalValue: number;
  contribution: number;
}

// Mirrors DuelRatingResponse. Current balance, separate from a past game's audit.
export interface DuelRating {
  userId: number;
  points: number;
}

// Mirrors DuelSettlementResponse. These historical balances never change after settlement.
export interface DuelSettlement {
  schemaVersion: number;
  matchId: string;
  settledAt: string;
  formulaVersion: string;
  outcome: DuelOutcome;
  winnerId: number | null;
  budget: number;
  finalValueGap: number;
  rawTransfer: number;
  appliedTransfer: number;
  loserFloorApplied: boolean;
  players: DuelRatingChange[];
}

export interface DuelRatingChange {
  userId: number;
  username: string;
  seat: number;
  pointsBefore: number;
  delta: number;
  pointsAfter: number;
}
