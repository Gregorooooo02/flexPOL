import { cn } from 'cn';
import { formatSignedPercent } from '../portfolio/money';

export function SignedChange({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">Unavailable</span>;
  const rounded = Math.round(Math.abs(value) * 1000) * Math.sign(value);
  return (
    <span
      className={cn(
        'font-heading tabular-nums [overflow-wrap:anywhere]',
        rounded > 0 ? 'text-gain' : rounded < 0 ? 'text-loss' : 'text-muted-foreground',
      )}
    >
      <span className="sr-only">{rounded > 0 ? 'Up ' : rounded < 0 ? 'Down ' : 'Unchanged '}</span>
      <span aria-hidden="true">{rounded > 0 ? '▲ ' : rounded < 0 ? '▼ ' : ''}</span>
      {formatSignedPercent(value)}
    </span>
  );
}
