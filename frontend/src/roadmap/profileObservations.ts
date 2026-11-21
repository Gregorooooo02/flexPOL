import { addCalendarMonths } from './calendar';
import type { GoalBrief, GoalProfile } from './types';
import { ROADMAP_GUIDANCE } from './guidance.generated';

export type ObservationId = keyof typeof ROADMAP_GUIDANCE;
export interface ProfileObservation { readonly id: ObservationId; readonly category: 'question' | 'tradeoff' | 'review' }

/** These are separate educational observations, not a financial assessment or suitability score. */
export function profileObservations(goal: GoalBrief, profile: GoalProfile | null, today: string): ProfileObservation[] {
  const result: ProfileObservation[] = [];
  if (goal.targetCents === undefined || !goal.goalDate) result.push({ id: 'missing-goal', category: 'question' });
  if (!profile?.liquidity || !profile.lossCapacity || !profile.willingness || !profile.knowledge) result.push({ id: 'unanswered', category: 'question' });
  if (profile?.liquidity === 'early-access') result.push({ id: 'early-access', category: 'tradeoff' });
  if (profile?.willingness === 'comfortable' && (profile.lossCapacity === 'essential-needs' || profile.lossCapacity === 'delay-goal')) {
    result.push({ id: 'capacity-tension', category: 'tradeoff' });
  }
  if (profile?.willingness === 'comfortable' && goal.goalDate && goal.goalDate >= today && goal.goalDate < addCalendarMonths(today, 24)) {
    result.push({ id: 'timing-tension', category: 'tradeoff' });
  }
  if ([profile?.liquidity, profile?.lossCapacity, profile?.willingness, profile?.knowledge].includes('unknown')) result.push({ id: 'not-sure', category: 'question' });
  if (profile?.knowledge === 'starting') result.push({ id: 'starting-knowledge', category: 'question' });
  if (goal.goalDate && goal.goalDate < today) result.push({ id: 'past-goal', category: 'review' });
  if (profile?.reviewNotes?.trim()) result.push({ id: 'review-note', category: 'review' });
  return result;
}
