import { Badge } from '@/components/ui/badge';
import { MoneyValue } from '@/workspace/components/MoneyValue';
import { formatPercent } from '@/workspace/portfolio/money';

export function PlaygroundHeader({
  totalCents,
  cashCents,
  investedCents,
}: {
  totalCents: number;
  cashCents: number;
  investedCents: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-lg font-semibold tracking-tight">Playground</h1>
          <Badge variant="secondary">Simulated market · not real data</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Total value</span>
          <MoneyValue cents={totalCents} className="text-2xl font-semibold" />
        </div>
      </div>
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
    </div>
  );
}
