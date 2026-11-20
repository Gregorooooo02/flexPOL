import { useId } from 'react';
import type { HistoricalObservation } from '@/model';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { formatHistoryDate, historyChange, historyPath } from '../history';
import { SignedChange } from './SignedChange';

const indexFormat = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 2 });

export function PriceChart({ points }: { points: readonly HistoricalObservation[] }) {
  const titleId = useId();
  if (points.length < 2) {
    return (
      <Empty className="p-6">
        <EmptyHeader>
          <EmptyTitle>History unavailable</EmptyTitle>
          <EmptyDescription>At least two observations are needed to draw a trend.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  const first = points[0];
  const last = points.at(-1)!;
  const values = points.map((point) => point.value);
  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          Historical index · <SignedChange value={historyChange(points)} />
        </span>
        <span className="text-xs text-muted-foreground">Selected period, not a forecast</span>
      </figcaption>
      <svg
        viewBox="0 0 560 144"
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={titleId}
        className="h-36 w-full text-primary"
      >
        <title id={titleId}>
          Historical index from {formatHistoryDate(first.originalDate)} to{' '}
          {formatHistoryDate(last.originalDate)}: {indexFormat.format(first.value)} to{' '}
          {indexFormat.format(last.value)}.
        </title>
        <path
          d={historyPath(points, 560, 144)}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        {[
          ['Start', first.value],
          ['End', last.value],
          ['Low', Math.min(...values)],
          ['High', Math.max(...values)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-heading tabular-nums">{indexFormat.format(Number(value))}</dd>
          </div>
        ))}
      </dl>
      <p className="flex justify-between gap-2 text-xs text-muted-foreground">
        <span>{formatHistoryDate(first.originalDate)}</span>
        <span>{formatHistoryDate(last.originalDate)}</span>
      </p>
    </figure>
  );
}
