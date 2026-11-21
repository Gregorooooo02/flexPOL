import type { JourneySource } from '@/journey/types';
import type { GoalBrief } from '@/roadmap/types';
import type { BufferInput, EmergencyBufferDraft, GoalPlannerDraft } from './types';

export function emptyGoalDraft(source: JourneySource): GoalPlannerDraft {
  return { tool: 'goal-planner', source, target: '', goalDate: '', dateInputInvalid: false, saved: '', monthlyContribution: '', returnEnabled: false, inflationEnabled: false, annualReturn: '', inflation: '' };
}

export function emptyBufferDraft(source: JourneySource): EmergencyBufferDraft {
  return { tool: 'emergency-buffer', source, monthlyExpenses: '', accessibleSavings: '', earmarkedExpenses: '', targetMonths: '' };
}

export function goalDraftFromSaved(draft: GoalPlannerDraft, goal: GoalBrief): GoalPlannerDraft {
  const amount = (value: number | undefined) => value === undefined ? '' : (value / 100).toFixed(2);
  return { ...draft, target: amount(goal.targetCents), saved: amount(goal.savedCents), goalDate: goal.goalDate ?? '', dateInputInvalid: false, monthlyContribution: amount(goal.monthlyContributionCents) };
}

export function bufferDraftFromSaved(source: JourneySource, input: BufferInput): EmergencyBufferDraft {
  return { tool: 'emergency-buffer', source, monthlyExpenses: (input.monthlyExpensesCents / 100).toFixed(2), accessibleSavings: (input.accessibleSavingsCents / 100).toFixed(2), earmarkedExpenses: (input.earmarkedExpensesCents / 100).toFixed(2), targetMonths: String(input.targetMonths) };
}
