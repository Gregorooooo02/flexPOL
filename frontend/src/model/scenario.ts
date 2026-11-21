// Mirrors backend DTO: ScenarioResponse (and its nested records).

import type { AssetClass, RiskLevel } from './instrument';
import type { SubchapterSummary } from './subchapter';

export type ScenarioRuleType = 'MAX_SHARE_EACH' | 'MAX_TOTAL_SHARE';

export interface ScenarioPersona {
  name: string;
  age: number | null;
  situation: string | null;
}

/** Paid on the first simulated point on or after `day` (days after the start), from cash first. */
export interface ScenarioMoneyNeed {
  day: number;
  amount: number;
  label: string;
}

/** A catalogue instrument the scenario allows (`AllowedInstrument`); cash is always available too. */
export interface ScenarioInstrument {
  id: number;
  name: string;
  assetClass: AssetClass;
  riskLevel: RiskLevel;
}

/** An advisory rule; `maxShare` is a fraction of the budget. */
export interface ScenarioRule {
  type: ScenarioRuleType;
  maxShare: number;
  label: string;
  instrumentIds: number[];
}

/** Parameters of the score formula (knowledge/sandbox-scenarios.md §4); drops are fractions. */
export interface ScenarioScoring {
  target: number;
  floor: number;
  maxDrawdown: number;
  growthWeight: number;
  stabilityWeight: number;
  rulePenaltyPoints: number;
}

/**
 * A sandbox scenario's brief. The seed, reference allocations, traps and debrief points stay on
 * the server, so they are not part of this type.
 */
export interface Scenario {
  id: number;
  slug: string;
  code: string;
  sortOrder: number;
  chapterId: number;
  chapterNumber: number;
  chapterTitle: string;
  title: string;
  persona: ScenarioPersona;
  goal: string;
  currency: string;
  budget: number;
  durationDays: number;
  moneyNeeds: ScenarioMoneyNeed[];
  instruments: ScenarioInstrument[];
  rules: ScenarioRule[];
  scoring: ScenarioScoring;
  retirementGap: number | null;
  lessons: SubchapterSummary[];
  notSimulated: string[];
}
