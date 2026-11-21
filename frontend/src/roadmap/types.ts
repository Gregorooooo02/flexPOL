import type { JourneySource } from '@/journey/types';
import type { BufferInput } from '@/tools/types';

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
  readonly reviewNotes?: string;
}

export type SetupStep = 'goal' | 'constraints' | 'review';

/** Raw edits are separate from saved facts and never go into route state or storage. */
export interface RoadmapSetupDraft {
  readonly goalId: string;
  readonly title: string;
  readonly targetAmount: string;
  readonly goalDate: string;
  /** Native date fields expose incomplete calendar edits as an empty value plus badInput. */
  readonly dateInputInvalid: boolean;
  readonly savedAmount: string;
  readonly monthlyContribution: string;
  readonly profile: GoalProfile;
  readonly source: JourneySource;
  readonly step: SetupStep;
}

export interface RoadmapAction {
  readonly actionId: string;
  readonly goalId: string;
  readonly status: 'todo' | 'checked' | 'later' | 'stuck';
  readonly reflection?: string;
  readonly source: JourneySource;
}

export interface BufferPlan {
  readonly goalId: string;
  readonly input: BufferInput;
  readonly source: JourneySource;
  readonly goalSavedCentsAtConfirmation: number | undefined;
  readonly separationNeedsReview: boolean;
}
