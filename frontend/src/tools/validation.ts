import { parseAmountInput } from '@/workspace/portfolio/money';
import { addCalendarMonths, isCalendarDate } from '@/roadmap/calendar';
import type { BufferInput, EmergencyBufferDraft, GoalAssumptions, GoalPlannerDraft, GoalPlannerInput } from './types';

export type ToolErrors = Partial<Record<string, string>>;
export const MAX_AMOUNT_CENTS = 100_000_000_000;
export const isToolAmount = (value: number) => Number.isSafeInteger(value) && value >= 0 && value <= MAX_AMOUNT_CENTS;

function amount(raw: string, field: string, errors: ToolErrors): number | null {
  if (!raw.trim()) { errors[field] = 'Enter an amount, including an explicit 0 if none.'; return null; }
  const cents = raw.length <= 40 ? parseAmountInput(raw) : null;
  if (cents === null || !isToolAmount(cents)) { errors[field] = 'Enter a valid EUR amount from 0 to 1 billion.'; return null; }
  return cents;
}

function rate(raw: string, field: string, minimum: number, errors: ToolErrors): number | null {
  const text = raw.trim();
  const pattern = minimum < 0 ? /^-?\d+(?:[.,]\d{1,4})?$/ : /^\d+(?:[.,]\d{1,4})?$/;
  const percent = pattern.test(text) && text.length <= 20 ? Number(text.replace(',', '.')) : NaN;
  if (!Number.isFinite(percent) || percent < minimum || percent > 50) {
    errors[field] = `Enter an annual percentage from ${minimum} to 50, up to four decimal places; no grouping.`;
    return null;
  }
  return percent / 100;
}

export function isGoalInput(input: GoalPlannerInput, today: string): boolean {
  return isToolAmount(input.targetCents) && isToolAmount(input.savedCents) && isToolAmount(input.monthlyContributionCents)
    && isCalendarDate(today) && isCalendarDate(input.goalDate) && input.goalDate >= today && input.goalDate <= addCalendarMonths(today, 600);
}

export function isBufferInput(input: BufferInput): boolean {
  return isToolAmount(input.monthlyExpensesCents) && isToolAmount(input.accessibleSavingsCents) && isToolAmount(input.earmarkedExpensesCents)
    && Number.isInteger(input.targetMonths) && input.targetMonths >= 0 && input.targetMonths <= 60;
}

export function validateGoalTool(draft: GoalPlannerDraft, today: string) {
  const errors: ToolErrors = {};
  const targetCents = amount(draft.target, 'target', errors);
  const savedCents = amount(draft.saved, 'saved', errors);
  const monthlyContributionCents = amount(draft.monthlyContribution, 'monthlyContribution', errors);
  if (draft.dateInputInvalid || !isCalendarDate(draft.goalDate)) errors.goalDate = 'Enter a complete, real calendar date.';
  else if (draft.goalDate < today || draft.goalDate > addCalendarMonths(today, 600)) errors.goalDate = 'Choose today or a future date within 50 years.';
  const input: GoalPlannerInput | null = targetCents !== null && savedCents !== null && monthlyContributionCents !== null && !errors.goalDate
    ? { targetCents, savedCents, monthlyContributionCents, goalDate: draft.goalDate } : null;
  const annualReturn = draft.returnEnabled ? rate(draft.annualReturn, 'annualReturn', -90, errors) : null;
  const annualInflation = draft.inflationEnabled ? rate(draft.inflation, 'inflation', 0, errors) : null;
  const assumptionError = errors.annualReturn || errors.inflation ? 'The optional illustration is unavailable until its assumption fields are valid. The contributions-only baseline is still usable.' : null;
  const assumptions: GoalAssumptions | null = assumptionError || (!draft.returnEnabled && !draft.inflationEnabled) ? null : { annualReturn, annualInflation };
  return { errors, input, assumptions, assumptionError };
}

export function validateBufferTool(draft: EmergencyBufferDraft) {
  const errors: ToolErrors = {};
  const monthlyExpensesCents = amount(draft.monthlyExpenses, 'monthlyExpenses', errors);
  const accessibleSavingsCents = amount(draft.accessibleSavings, 'accessibleSavings', errors);
  const earmarkedExpensesCents = amount(draft.earmarkedExpenses, 'earmarkedExpenses', errors);
  const targetMonths = /^\d{1,2}$/.test(draft.targetMonths.trim()) ? Number(draft.targetMonths.trim()) : NaN;
  if (!Number.isInteger(targetMonths) || targetMonths > 60) errors.targetMonths = 'Choose a whole number of months from 0 to 60. This is your choice, not a recommendation.';
  const input: BufferInput | null = monthlyExpensesCents !== null && accessibleSavingsCents !== null && earmarkedExpensesCents !== null && !errors.targetMonths
    ? { monthlyExpensesCents, accessibleSavingsCents, earmarkedExpensesCents, targetMonths } : null;
  return { errors, input };
}
