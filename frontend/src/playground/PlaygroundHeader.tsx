import type { Ref } from 'react';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MoneyValue, SignedMoney } from '@/workspace/components/MoneyValue';
import { SignedChange } from '@/workspace/components/SignedChange';
import { ValueChart } from '@/workspace/components/ValueChart';
import { formatHistoryDate } from '@/workspace/history';
import { formatPercent } from '@/workspace/portfolio/money';

export function PlaygroundHeader({
  totalCents,
  cashCents,
  investedCents,
  budgetCents,
  date,
  dayIndex,
  lastIndex,
  status,
  dates,
  equity,
  titleRef,
}: {
  totalCents: number;
  cashCents: number;
  investedCents: number;
  budgetCents: number;
  date?: string;
  dayIndex: number;
  lastIndex: number;
  status: string;
  dates: readonly string[];
  equity: readonly number[];
  titleRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="grid min-w-0 grid-cols-2 items-end gap-3 md:grid-cols-[minmax(0,1fr)_11rem_auto]">
        <div className="flex min-w-0 flex-col gap-1">
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="font-heading text-lg font-semibold tracking-tight [overflow-wrap:anywhere]"
          >
            Playground
          </h1>
          <Badge variant="secondary" className="max-w-full whitespace-normal">
            Simulated market · virtual money
          </Badge>
        </div>
        <div className="hidden w-44 md:block">
          <ValueChart label="Portfolio value so far" dates={dates} values={equity} compact />
        </div>
        <div
          className={cn(
            'flex min-w-0 flex-col items-end gap-1 text-right',
            Math.abs(totalCents) >= 1_000_000_000 && 'col-span-2 md:col-span-1',
          )}
        >
          <span className="text-xs text-muted-foreground">Total value</span>
          <MoneyValue cents={totalCents} className="text-2xl font-semibold" />
          <div className="flex flex-wrap justify-end gap-2 text-xs">
            <SignedMoney cents={totalCents - budgetCents} />
            <SignedChange value={(totalCents - budgetCents) / budgetCents} />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]" aria-live="off">
        {date ? `${formatHistoryDate(date)} · ` : ''}
        {status}
      </p>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Available cash</dt>
          <dd>
            <MoneyValue cents={cashCents} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Invested</dt>
          <dd>
            <MoneyValue cents={investedCents} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Allocated</dt>
          <dd className="font-heading tabular-nums">
            {formatPercent(totalCents > 0 ? investedCents / totalCents : 0)}
          </dd>
        </div>
      </dl>
      {lastIndex > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Market step {dayIndex} of {lastIndex}
          </span>
          <Progress
            aria-label="Replay progress"
            value={(dayIndex / lastIndex) * 100}
            className="motion-reduce:[&_[data-slot=progress-indicator]]:transition-none"
          />
        </div>
      )}
    </div>
  );
}
