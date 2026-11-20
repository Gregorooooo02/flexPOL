import { cn } from 'cn';
import { formatMoney, formatSignedMoney } from '../portfolio/money';

export function MoneyValue({ cents, className }: { cents: number; className?: string }) {
  return (
    <span className={cn('font-heading tabular-nums [overflow-wrap:anywhere]', className)}>
      {formatMoney(cents)}
    </span>
  );
}

export function SignedMoney({ cents }: { cents: number }) {
  return (
    <span
      className={cn(
        'font-heading tabular-nums [overflow-wrap:anywhere]',
        cents > 0 ? 'text-gain' : cents < 0 ? 'text-loss' : 'text-muted-foreground',
      )}
    >
      <span aria-hidden="true">{cents > 0 ? '▲ ' : cents < 0 ? '▼ ' : ''}</span>
      {formatSignedMoney(cents)}
    </span>
  );
}
