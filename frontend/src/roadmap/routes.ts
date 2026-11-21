import type { ProfileSection, SetupStep } from './types';

const SECTIONS: readonly ProfileSection[] = ['goal', 'liquidity', 'risk', 'knowledge', 'review'];

export function readProfileSection(search: URLSearchParams): ProfileSection | null {
  const values = search.getAll('section');
  return values.length === 1 && SECTIONS.includes(values[0] as ProfileSection) ? values[0] as ProfileSection : null;
}

export function sectionStep(section: ProfileSection): SetupStep {
  return section === 'goal' || section === 'review' ? section : 'constraints';
}
