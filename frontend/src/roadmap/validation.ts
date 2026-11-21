import { parseAmountInput } from '@/workspace/portfolio/money';
import type { JourneySource } from '@/journey/types';
import { addCalendarMonths, isCalendarDate } from './calendar';
import type { GoalBrief, GoalProfile, RoadmapSetupDraft } from './types';

export type SetupErrors = Partial<Record<'title' | 'targetAmount' | 'goalDate' | 'savedAmount' | 'monthlyContribution' | 'reviewNotes', string>>;
const amountText = (cents: number | undefined) => cents === undefined ? '' : (cents / 100).toFixed(2);

export function createSetupDraft(goalId: string, source: JourneySource, goal: GoalBrief | null, profile: GoalProfile | null): RoadmapSetupDraft {
  return {
    goalId, source, step: 'goal', title: goal?.title ?? '', goalDate: goal?.goalDate ?? '', dateInputInvalid: false,
    targetAmount: amountText(goal?.targetCents), savedAmount: amountText(goal?.savedCents),
    monthlyContribution: amountText(goal?.monthlyContributionCents),
    profile: profile?.goalId === goalId ? { ...profile } : { goalId },
  };
}

export function draftHasChanges(draft: RoadmapSetupDraft, goal: GoalBrief | null, profile: GoalProfile | null): boolean {
  const saved = createSetupDraft(draft.goalId, draft.source, goal, profile);
  return (['title', 'targetAmount', 'goalDate', 'dateInputInvalid', 'savedAmount', 'monthlyContribution'] as const).some((field) => draft[field] !== saved[field])
    || (['liquidity', 'lossCapacity', 'willingness', 'knowledge', 'reviewNotes'] as const).some((field) => (draft.profile[field] ?? '') !== (saved.profile[field] ?? ''));
}

export function validateDraft(draft: RoadmapSetupDraft, today: string, savedGoal: GoalBrief | null) {
  const errors: SetupErrors = {};
  if (!draft.title.trim() || draft.title.trim().length > 80) errors.title = 'Enter a goal name between 1 and 80 characters.';
  function amount(field: 'targetAmount' | 'savedAmount' | 'monthlyContribution'): number | undefined {
    const raw = draft[field];
    if (!raw.trim()) return undefined;
    const cents = raw.length <= 40 ? parseAmountInput(raw) : null;
    if (cents === null || cents > 100_000_000_000) {
      errors[field] = 'Enter a valid nonnegative EUR amount, up to 1 billion.';
      return undefined;
    }
    return cents;
  }
  const targetCents = amount('targetAmount');
  const savedCents = amount('savedAmount');
  const monthlyContributionCents = amount('monthlyContribution');
  if (draft.dateInputInvalid) errors.goalDate = 'Complete or clear the calendar date.';
  else if (draft.goalDate) {
    if (!isCalendarDate(draft.goalDate)) errors.goalDate = 'Enter a real calendar date.';
    else if (draft.goalDate < today && draft.goalDate !== savedGoal?.goalDate) errors.goalDate = 'Choose today or a future date.';
    else if (draft.goalDate > addCalendarMonths(today, 600)) errors.goalDate = 'Choose a date within the next 50 years.';
  }
  if ((draft.profile.reviewNotes?.length ?? 0) > 500) errors.reviewNotes = 'Keep your questions to 500 characters.';
  const goal: GoalBrief = {
    id: draft.goalId, title: draft.title.trim(), targetCents,
    goalDate: isCalendarDate(draft.goalDate) ? draft.goalDate : undefined, savedCents, monthlyContributionCents,
  };
  const profile: GoalProfile = { ...draft.profile, goalId: draft.goalId, reviewNotes: draft.profile.reviewNotes?.trim() || undefined };
  return { goal, profile, errors, valid: Object.keys(errors).length === 0 };
}
