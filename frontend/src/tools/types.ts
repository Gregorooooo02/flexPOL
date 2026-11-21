import type { JourneySource } from '@/journey/types';

export type ToolId = 'goal-planner' | 'emergency-buffer' | 'fee-impact';

export interface GoalPlannerDraft {
  tool: 'goal-planner';
  source: JourneySource;
  target: string;
  goalDate: string;
  dateInputInvalid: boolean;
  saved: string;
  monthlyContribution: string;
  returnEnabled: boolean;
  inflationEnabled: boolean;
  annualReturn: string;
  inflation: string;
}

export interface EmergencyBufferDraft {
  tool: 'emergency-buffer';
  source: JourneySource;
  monthlyExpenses: string;
  accessibleSavings: string;
  earmarkedExpenses: string;
  targetMonths: string;
}

export interface GoalPlannerInput {
  targetCents: number;
  goalDate: string;
  savedCents: number;
  monthlyContributionCents: number;
}

export interface GoalAssumptions {
  /** Effective annual fractions; null means that assumption is disabled. */
  annualReturn: number | null;
  annualInflation: number | null;
}

export interface BufferInput {
  monthlyExpensesCents: number;
  accessibleSavingsCents: number;
  earmarkedExpensesCents: number;
  targetMonths: number;
}

/** Editable text is deliberately separate from validated goal facts (integer cents). */
export type ToolDraft =
  | GoalPlannerDraft
  | EmergencyBufferDraft
  | { tool: 'fee-impact'; initialAmount: string; monthlyContribution: string; years: string; annualReturn: string; feeA: string; feeB: string };

export type ToolDrafts = Partial<{ [K in ToolId]: Extract<ToolDraft, { tool: K }> }>;
