import type { JourneySource } from '@/journey/types';

export type ProfileSection = 'goal' | 'liquidity' | 'risk' | 'knowledge' | 'review';

export interface GoalBrief {
  readonly id: string;
  readonly title?: string;
  readonly targetCents?: number;
  readonly goalDate?: string;
  readonly savedCents?: number;
  readonly monthlyContributionCents?: number;
}

/** Omitted means unanswered; 'unknown' is an explicit "not sure" answer. */
export interface GoalProfile {
  readonly goalId: string;
  readonly liquidity?: 'early-access' | 'no-early-access' | 'unknown';
  readonly lossCapacity?: 'essential-needs' | 'delay-goal' | 'flexible' | 'unknown';
  readonly willingness?: 'uncomfortable' | 'uncertain' | 'comfortable' | 'unknown';
  readonly knowledge?: 'starting' | 'some' | 'experienced' | 'unknown';
}

export interface RoadmapAction {
  readonly actionId: string;
  readonly goalId: string;
  readonly status: 'todo' | 'checked' | 'later' | 'stuck';
  readonly reflection?: string;
  readonly source: JourneySource;
}
