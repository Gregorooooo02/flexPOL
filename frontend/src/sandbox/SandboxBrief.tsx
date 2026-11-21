import { CancelCircleIcon, CheckmarkCircle02Icon, Clock01Icon, Target02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { IconSvgElement } from '@hugeicons/react';
import { cn } from 'cn';
import type { Scenario, ScenarioMoneyNeedRun } from '@/model';
import { formatDays, formatEuros, formatShare } from '@/scenarios/format';
import { formatHistoryDate } from '@/workspace/history';
import type { RuleCheck } from './rules';

/**
 * The mission while the learner plans and watches: goal, money needed along the way (with how
 * each was paid once the replay reaches it) and the advisory rules, checked live.
 */
export function SandboxBrief({
  scenario,
  ruleChecks,
  revealedNeeds,
}: {
  scenario: Scenario;
  ruleChecks: readonly RuleCheck[];
  /** Needs the replay has reached, by their position in `scenario.moneyNeeds`. */
  revealedNeeds: ReadonlyMap<number, ScenarioMoneyNeedRun>;
}) {
  const metCount = ruleChecks.filter((check) => check.met).length;
  return (
    <section aria-label="Mission" className="flex flex-col gap-4 border border-border bg-card p-4">
      <div className="flex flex-col gap-1 border-l-2 border-primary bg-secondary/60 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
          <HugeiconsIcon icon={Target02Icon} className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Goal · {formatEuros(scenario.budget)} over {formatDays(scenario.durationDays)}
        </p>
        <p className="text-sm leading-snug [overflow-wrap:anywhere]">{scenario.goal}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Money needed along the way
          </h2>
          {scenario.moneyNeeds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing before the end.</p>
          ) : (
            <ul role="list" className="flex flex-col gap-2 text-sm">
              {scenario.moneyNeeds.map((need, index) => {
                const outcome = revealedNeeds.get(index);
                const short = outcome !== undefined && outcome.shortfall > 0;
                return (
                  <li key={`${need.day}-${need.label}`} className="flex items-start gap-2">
                    <StatusIcon
                      icon={outcome === undefined ? Clock01Icon : short ? CancelCircleIcon : CheckmarkCircle02Icon}
                      className={outcome === undefined ? 'text-muted-foreground' : short ? 'text-loss' : 'text-gain'}
                    />
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      <span className="font-medium">{need.label}</span> · {formatEuros(need.amount)}
                      <span className="block text-xs text-muted-foreground">
                        {outcome === undefined
                          ? `Due on day ${need.day}, after ${formatDays(need.day)}`
                          : short
                            ? `Short by ${formatEuros(outcome.shortfall)} on ${formatHistoryDate(outcome.date)}`
                            : `Paid on ${formatHistoryDate(outcome.date)}: ${paidFrom(outcome)}`}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Rules{ruleChecks.length > 0 && ` · ${metCount} of ${ruleChecks.length} met`}
          </h2>
          {ruleChecks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No extra rules.</p>
          ) : (
            <ul role="list" className="flex flex-col gap-2 text-sm">
              {ruleChecks.map(({ rule, met }) => (
                <li key={`${rule.type}-${rule.label}`} className="flex items-start gap-2">
                  <StatusIcon
                    icon={met ? CheckmarkCircle02Icon : CancelCircleIcon}
                    className={met ? 'text-gain' : 'text-loss'}
                  />
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="sr-only">{met ? 'Met: ' : 'Broken: '}</span>
                    {rule.label}
                    <span className="block text-xs text-muted-foreground">
                      {met ? 'Met' : 'Broken · costs a star'} ·{' '}
                      {rule.type === 'MAX_TOTAL_SHARE' ? 'together' : 'each'} at most {formatShare(rule.maxShare)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusIcon({ icon, className }: { icon: IconSvgElement; className: string }) {
  return (
    <HugeiconsIcon
      icon={icon}
      className={cn('mt-0.5 size-4 shrink-0', className)}
      strokeWidth={2}
      aria-hidden="true"
    />
  );
}

function paidFrom(outcome: ScenarioMoneyNeedRun): string {
  if (outcome.paidFromHoldings === 0) return 'from cash';
  if (outcome.paidFromCash === 0) return 'by selling holdings';
  return `${formatEuros(outcome.paidFromCash)} from cash, ${formatEuros(outcome.paidFromHoldings)} from holdings`;
}
