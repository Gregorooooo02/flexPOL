import type { Scenario, ScenarioRunResponse, ShareRangeResult, StarCriterionKey } from '@/model';
import { formatEuros, formatShare } from '@/scenarios/format';
import { formatMoney, formatPercent } from '@/workspace/portfolio/money';

export const CRITERION_TITLES: Record<StarCriterionKey, string> = {
  GROWTH: 'Growth',
  GOAL: 'Goal',
  ASSETS: 'Instruments',
  SHARES: 'Balance',
};

/** One or two plain sentences on why a criterion was or wasn't earned. */
export function criterionDetail(key: StarCriterionKey, earned: boolean, run: ScenarioRunResponse, scenario: Scenario): string {
  const name = scenario.persona.name;
  switch (key) {
    case 'GROWTH': {
      const gainCents = Math.round((run.finalValue + run.paidOut - run.budget) * 100);
      const paid = run.paidOut > 0 ? `, counting the ${formatEuros(run.paidOut)} paid out` : '';
      if (earned) return `The plan grew by ${formatMoney(gainCents)} (${formatPercent(run.totalReturn)})${paid}.`;
      if (gainCents === 0) return `The money ended exactly where it started${paid}: cash earns nothing here.`;
      return `The plan ended ${formatMoney(-gainCents)} (${formatPercent(-run.totalReturn)}) below the start${paid}.`;
    }
    case 'GOAL': {
      const shortfall = run.moneyNeeds.reduce((total, need) => total + need.shortfall, 0);
      if (shortfall > 0) return `A payment couldn't be made in full: ${formatEuros(shortfall)} was missing.`;
      const bills = run.moneyNeeds.length > 0 ? ' and paid every bill on time' : '';
      if (earned) return `Ended with ${formatEuros(run.finalValue)}${bills}; the goal needed at least ${formatEuros(scenario.scoring.target)}.`;
      return `Ended with ${formatEuros(run.finalValue)}${bills}, but the goal needed at least ${formatEuros(scenario.scoring.target)}.`;
    }
    case 'ASSETS': {
      const names = instrumentNames(scenario);
      const { stars } = run;
      if (stars.unsuitableInstrumentIds.length > 0) {
        return `Not a good fit for ${name}: ${stars.unsuitableInstrumentIds.map(names).join(', ')}.`;
      }
      if (!earned) {
        return `Cash alone doesn't fit this goal: choose at least ${stars.minInstruments} ${
          stars.minInstruments === 1 ? 'instrument' : 'instruments'
        } that suit ${name}.`;
      }
      return run.instruments.length === 0
        ? `Keeping everything in cash fits ${name}'s situation.`
        : `Every instrument you chose suits ${name}'s situation.`;
    }
    case 'SHARES':
      return earned ? 'Your split is inside every range below.' : 'Part of your split is outside a range below.';
  }
}

/** "Suitable here: A, B (and cash)", or a note that only cash fits. */
export function suitableSummary(run: ScenarioRunResponse, scenario: Scenario): string {
  const ids = run.stars.suitableInstrumentIds;
  if (ids.length === 0) return 'Only cash suits this situation.';
  return `Suitable here: ${ids.map(instrumentNames(scenario)).join(', ')}, and cash.`;
}

/** "Cash: 80% · right range at least 70%", or for a per-fund cap "largest 50% · at most 35%". */
export function rangeLine(range: ShareRangeResult): { label: string; value: string; target: string } {
  const target =
    range.min === 0
      ? `at most ${formatShare(range.max)}`
      : range.max === 1
        ? `at least ${formatShare(range.min)}`
        : `${formatShare(range.min)}–${formatShare(range.max)}`;
  return {
    label: range.label,
    value: range.each ? `largest ${formatShare(range.share)}` : formatShare(range.share),
    target: range.each ? `each ${target}` : target,
  };
}

function instrumentNames(scenario: Scenario): (id: number) => string {
  const byId = new Map(scenario.instruments.map((instrument) => [instrument.id, instrument.name]));
  return (id) => byId.get(id) ?? `Instrument ${id}`;
}
