import type { GoalProfile } from './types';

export const PROFILE_OPTIONS = {
  liquidity: [
    { value: 'early-access', label: 'I may need some earlier' },
    { value: 'no-early-access', label: 'No earlier need expected' },
    { value: 'unknown', label: 'Not sure' },
  ],
  lossCapacity: [
    { value: 'essential-needs', label: 'Affects essential needs' },
    { value: 'delay-goal', label: 'Delays this goal' },
    { value: 'flexible', label: 'My plan can adapt' },
    { value: 'unknown', label: 'Not sure' },
  ],
  willingness: [
    { value: 'uncomfortable', label: 'Uncomfortable' },
    { value: 'uncertain', label: 'Mixed feelings' },
    { value: 'comfortable', label: 'Comfortable with uncertainty' },
    { value: 'unknown', label: 'Not sure' },
  ],
  knowledge: [
    { value: 'starting', label: 'Starting out' },
    { value: 'some', label: 'Some familiarity' },
    { value: 'experienced', label: 'Experienced' },
    { value: 'unknown', label: 'Not sure' },
  ],
} as const;

export type ProfileAnswerKey = keyof typeof PROFILE_OPTIONS;

export function profileAnswerLabel(profile: GoalProfile | null, key: ProfileAnswerKey): string {
  const value = profile?.[key];
  return PROFILE_OPTIONS[key].find((option) => option.value === value)?.label ?? 'Not provided';
}
