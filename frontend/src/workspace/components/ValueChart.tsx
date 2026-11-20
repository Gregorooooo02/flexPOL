import { useId } from 'react';
import { cn } from 'cn';
import { formatHistoryDate } from '../history';
import { formatMoney } from '../portfolio/money';

interface ValueChartProps {
  label: string;
  dates: readonly string[];
  values: readonly number[];
  unit?: 'EUR' | 'INDEX';
  compact?: boolean;
}

const indexFormat = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 2 });

/** Generic revealed-data chart. EUR values are cents; index values are dimensionless. */
export function ValueChart({
  label,
  dates,
  values,
  unit = 'EUR',
  compact = false,
}: ValueChartProps) {
  const titleId = useId();
  if (values.length === 0 || dates.length !== values.length) return null;
  const width = 560;
  const height = compact ? 72 : 136;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const count = Math.min(160, values.length);
  const path = Array.from({ length: count }, (_, i) => {
    const index = count === 1 ? 0 : Math.round((i * (values.length - 1)) / (count - 1));
    const x = values.length === 1 ? width / 2 : 4 + (index / (values.length - 1)) * (width - 8);
    const y =
      low === high ? height / 2 : 4 + ((high - values[index]) / (high - low)) * (height - 8);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const format = (value: number) =>
    unit === 'EUR' ? formatMoney(value) : indexFormat.format(value);
  const first = values[0];
  const last = values.at(-1)!;
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      {!compact && (
        <figcaption className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>{label}</span>
          <span>
            {format(first)} → {format(last)}
            {unit === 'INDEX' ? ' index' : ''}
          </span>
        </figcaption>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={titleId}
        className={cn('w-full text-primary', compact ? 'h-12' : 'h-32')}
      >
        <title id={titleId}>
          {label}, {formatHistoryDate(dates[0])} to {formatHistoryDate(dates.at(-1)!)}:{' '}
          {format(first)} to {format(last)}.
        </title>
        {values.length === 1 ? (
          <circle cx={width / 2} cy={height / 2} r="3" fill="currentColor" />
        ) : (
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {!compact && (
        <p className="flex justify-between gap-2 text-xs text-muted-foreground">
          <span>{formatHistoryDate(dates[0])}</span>
          <span>{formatHistoryDate(dates.at(-1)!)}</span>
        </p>
      )}
    </figure>
  );
}
