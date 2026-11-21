import type { ScenarioRule } from '@/model';
import type { Cents } from '@/workspace/portfolio/money';

export interface RuleCheck {
  readonly rule: ScenarioRule;
  readonly met: boolean;
}

/** Rule shares have at most four decimals (e.g. 0.05), so they compare exactly as basis points. */
const BASIS_POINTS = 10_000;

/**
 * Checks the advisory rules against the planned amounts, the same way the server scores them:
 * an amount breaks a rule when it is above `maxShare × budget` (so exactly the limit is fine).
 * `MAX_SHARE_EACH` checks each listed instrument; `MAX_TOTAL_SHARE` checks their sum.
 */
export function checkRules(
  rules: readonly ScenarioRule[],
  amountsCents: Readonly<Record<number, Cents>>,
  budgetCents: Cents,
): RuleCheck[] {
  return rules.map((rule) => {
    const limitBasisPoints = Math.round(rule.maxShare * BASIS_POINTS);
    const above = (cents: Cents) => cents * BASIS_POINTS > limitBasisPoints * budgetCents;
    const amounts = rule.instrumentIds.map((id) => amountsCents[id] ?? 0);
    const broken =
      rule.type === 'MAX_SHARE_EACH'
        ? amounts.some(above)
        : above(amounts.reduce((total, cents) => total + cents, 0));
    return { rule, met: !broken };
  });
}
