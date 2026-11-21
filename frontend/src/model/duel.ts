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

export type DuelPhase = 'BRIEFING' | 'PLANNING' | 'EVALUATING' | 'CANCELLED';
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
  serverNow: string;
  players: DuelPlayer[];
  ownPortfolio: DuelPortfolio;
}
