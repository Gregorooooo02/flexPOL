import { addCalendarMonths } from '@/roadmap/calendar';
import { isGoalInput } from '../validation';
import type { GoalAssumptions, GoalPlannerInput } from '../types';

export interface GoalPlannerResult {
  input: GoalPlannerInput;
  asOfDate: string;
  months: number;
  firstContributionDate: string | null;
  lastContributionDate: string | null;
  endingValueCents: number;
  gapCents: number;
  monthlyNeededCents: number | null;
  illustration: { assumptions: GoalAssumptions; endingValueCents: number; todaysMoneyCents: number | null } | null;
  illustrationError: string | null;
}

function safeValue(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && Number.isSafeInteger(Math.round(value));
}

/** Count anniversaries from the original date: Jan 31 -> Feb 28 -> Mar 31, not Mar 28. */
export function calculateGoal(input: GoalPlannerInput, today: string, assumptions: GoalAssumptions | null = null): GoalPlannerResult {
  if (!isGoalInput(input, today)) throw new RangeError('Invalid goal calculation inputs.');
  let months = 0;
  for (let month = 1; month <= 600 && addCalendarMonths(today, month) <= input.goalDate; month++) months = month;
  const endingValueCents = input.savedCents + months * input.monthlyContributionCents;
  const remaining = Math.max(0, input.targetCents - input.savedCents);
  const result: GoalPlannerResult = {
    input: { ...input }, asOfDate: today, months,
    firstContributionDate: months ? addCalendarMonths(today, 1) : null,
    lastContributionDate: months ? addCalendarMonths(today, months) : null,
    endingValueCents, gapCents: Math.max(0, input.targetCents - endingValueCents),
    monthlyNeededCents: remaining === 0 ? 0 : months ? Math.floor((remaining + months - 1) / months) : null,
    illustration: null, illustrationError: null,
  };
  if (!assumptions) return result;
  const annualReturn = assumptions.annualReturn ?? 0;
  const inflation = assumptions.annualInflation ?? 0;
  if (!Number.isFinite(annualReturn) || annualReturn < -0.9 || annualReturn > 0.5 || !Number.isFinite(inflation) || inflation < 0 || inflation > 0.5) {
    return { ...result, illustrationError: 'Optional assumptions are outside the supported ranges. The baseline remains usable.' };
  }
  const monthlyRate = Math.expm1(Math.log1p(annualReturn) / 12);
  let value = input.savedCents;
  for (let month = 0; month < months; month++) {
    value = value * (1 + monthlyRate) + input.monthlyContributionCents;
    if (!safeValue(value)) return { ...result, illustrationError: 'This illustration exceeds safe currency precision. Try a shorter horizon or smaller assumptions; the baseline is unchanged.' };
  }
  const realValue = assumptions.annualInflation === null ? null : value / (1 + inflation) ** (months / 12);
  if (realValue !== null && !safeValue(realValue)) return { ...result, illustrationError: 'This inflation illustration exceeds safe currency precision.' };
  result.illustration = { assumptions: { ...assumptions }, endingValueCents: value, todaysMoneyCents: realValue };
  return result;
}
