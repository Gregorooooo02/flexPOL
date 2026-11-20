import { cn } from 'cn';
import { formatMoney } from '../portfolio/money';

export function MoneyValue({ cents, className }: { cents: number; className?: string }) {
  return <span className={cn('font-heading tabular-nums', className)}>{formatMoney(cents)}</span>;
}
