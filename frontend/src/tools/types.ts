export type ToolId = 'goal-planner' | 'emergency-buffer' | 'fee-impact';

/** Editable text is deliberately separate from validated goal facts (integer cents). */
export type ToolDraft =
  | { tool: 'goal-planner'; target: string; goalDate: string; saved: string; monthlyContribution: string; annualReturn: string; inflation: string }
  | { tool: 'emergency-buffer'; monthlyExpenses: string; accessibleSavings: string; earmarkedExpenses: string; targetMonths: string }
  | { tool: 'fee-impact'; initialAmount: string; monthlyContribution: string; years: string; annualReturn: string; feeA: string; feeB: string };

export type ToolDrafts = Partial<{ [K in ToolId]: Extract<ToolDraft, { tool: K }> }>;
