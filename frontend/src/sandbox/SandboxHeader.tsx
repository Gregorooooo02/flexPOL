import type { ReactNode, Ref } from 'react';
import type { Scenario } from '@/model';
import { MoneyValue, SignedMoney } from '@/workspace/components/MoneyValue';
import { SignedChange } from '@/workspace/components/SignedChange';
import { formatMoney, formatPercent } from '@/workspace/portfolio/money';

/** The compact workspace header, laid out like the Playground's, with the Sandbox actions on the right. */
export function SandboxHeader({
  scenario,
  totalCents,
  cashCents,
  investedCents,
  budgetCents,
  paidOutCents,
  actions,
  titleRef,
}: {
  scenario: Scenario;
  totalCents: number;
  cashCents: number;
  investedCents: number;
  budgetCents: number;
  paidOutCents: number;
  actions: ReactNode;
  titleRef?: Ref<HTMLHeadingElement>;
}) {
  // Money paid out for the person's needs isn't a loss, so the change adds it back.
  const changeCents = totalCents + paidOutCents - budgetCents;
  return (
    <div className="grid min-w-0 items-center gap-2 @4xl/workspace-header:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] @4xl/workspace-header:items-baseline @4xl/workspace-header:gap-x-6">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="flex min-w-0 flex-col">
            <p className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
              Scenario {scenario.code} · {scenario.persona.name}
            </p>
            <h1
              ref={titleRef}
              tabIndex={-1}
              className="font-heading text-lg font-semibold tracking-tight [overflow-wrap:anywhere]"
            >
              {scenario.title}
            </h1>
          </div>
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs text-muted-foreground">Total</span>
            <MoneyValue cents={totalCents} className="text-lg font-semibold" />
            <div className="flex flex-wrap gap-2 text-xs">
              <SignedMoney cents={changeCents} />
              <SignedChange value={changeCents / budgetCents} />
            </div>
            {paidOutCents > 0 && (
              <span className="text-xs text-muted-foreground">incl. {formatMoney(paidOutCents)} paid out</span>
            )}
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <div className="flex min-w-0 flex-wrap gap-x-1">
            <dt className="text-muted-foreground">Cash</dt>
            <dd>
              <MoneyValue cents={cashCents} />
            </dd>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-1">
            <dt className="text-muted-foreground">Invested</dt>
            <dd>
              <MoneyValue cents={investedCents} />
            </dd>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-1">
            <dt className="text-muted-foreground">Allocated</dt>
            <dd className="font-heading tabular-nums">
              {formatPercent(totalCents > 0 ? investedCents / totalCents : 0)}
            </dd>
          </div>
        </dl>
      </div>
      {actions}
    </div>
  );
}
