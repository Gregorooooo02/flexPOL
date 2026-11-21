import type { ReactNode, Ref } from 'react';
import { MoneyValue, SignedMoney } from '@/workspace/components/MoneyValue';
import { SignedChange } from '@/workspace/components/SignedChange';
import { formatPercent } from '@/workspace/portfolio/money';

export function PlaygroundHeader({
  totalCents,
  cashCents,
  investedCents,
  budgetCents,
  actions,
  titleRef,
}: {
  totalCents: number;
  cashCents: number;
  investedCents: number;
  budgetCents: number;
  actions: ReactNode;
  titleRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="grid min-w-0 items-center gap-2 @4xl/workspace-header:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] @4xl/workspace-header:items-baseline @4xl/workspace-header:gap-x-6">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="font-heading text-lg font-semibold tracking-tight [overflow-wrap:anywhere]"
          >
            Playground
          </h1>
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs text-muted-foreground">Total</span>
            <MoneyValue cents={totalCents} className="text-lg font-semibold" />
            <div className="flex flex-wrap gap-2 text-xs">
              <SignedMoney cents={totalCents - budgetCents} />
              <SignedChange value={(totalCents - budgetCents) / budgetCents} />
            </div>
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
