import type { AssetClass } from '@/model';
import { cn } from 'cn';
import { ASSET_LABELS } from '../instruments';
import { formatPercent } from '../portfolio/money';
import type { PortfolioPosition } from './HoldingRow';
import { MoneyValue } from './MoneyValue';

const COLOURS: Record<AssetClass | 'CASH', string> = {
  CASH: 'bg-muted-foreground',
  STOCK: 'bg-primary',
  EQUITY_ETF: 'bg-chart-2',
  DEPOSIT: 'bg-chart-3',
};

export function AllocationBar({
  positions,
  cashCents,
  totalCents,
}: {
  positions: PortfolioPosition[];
  cashCents: number;
  totalCents: number;
}) {
  const segments = [
    { id: 'CASH', label: 'Cash', cents: cashCents },
    ...Object.entries(ASSET_LABELS).map(([id, label]) => ({
      id,
      label,
      cents: positions
        .filter((position) => position.instrument.assetClass === id)
        .reduce((sum, position) => sum + position.valueCents, 0),
    })),
  ].filter((segment) => segment.cents > 0);
  return (
    <figure className="flex flex-col gap-3" aria-label="Portfolio allocation">
      <figcaption className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Your allocation
      </figcaption>
      <div aria-hidden="true" className="flex h-2 w-full overflow-hidden bg-muted">
        {segments.map((segment) => (
          <span
            key={segment.id}
            className={COLOURS[segment.id as AssetClass | 'CASH']}
            style={{ width: `${totalCents > 0 ? (segment.cents / totalCents) * 100 : 0}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {segments.map((segment) => (
          <li key={segment.id} className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className={cn('size-2', COLOURS[segment.id as AssetClass | 'CASH'])}
            />
            <span>{segment.label}</span>
            <span>{formatPercent(totalCents > 0 ? segment.cents / totalCents : 0)}</span>
            <MoneyValue cents={segment.cents} />
          </li>
        ))}
      </ul>
    </figure>
  );
}
