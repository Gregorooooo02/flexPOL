import type { Instrument } from '@/model';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatPercent } from '../portfolio/money';
import { MoneyValue, SignedMoney } from './MoneyValue';

export interface PortfolioPosition {
  instrument: Instrument;
  valueCents: number;
  profitCents?: number;
}

export function HoldingRow({
  instrument,
  valueCents,
  profitCents,
  readOnly = false,
  totalCents,
  onOpen,
  onRemove,
}: PortfolioPosition & {
  totalCents: number;
  readOnly?: boolean;
  onOpen: (id: number, trigger: HTMLElement) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <li className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <h3 className="font-heading font-semibold [overflow-wrap:anywhere]">{instrument.name}</h3>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <MoneyValue cents={valueCents} />
            <span className="text-xs text-muted-foreground">
              {formatPercent(totalCents > 0 ? valueCents / totalCents : 0)} of portfolio
            </span>
            {profitCents !== undefined && (
              <span className="text-xs">
                Unrealised profit / loss <SignedMoney cents={profitCents} />
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              size="xs"
              variant="outline"
              aria-label={`${readOnly ? 'View' : 'Edit'} holding: ${instrument.name}`}
              onClick={(event) => onOpen(instrument.id, event.currentTarget)}
            >
              {readOnly ? 'View' : 'Edit'}
            </Button>
            {!readOnly && (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                aria-label={`Remove holding: ${instrument.name}`}
                onClick={() => onRemove(instrument.id)}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <Separator />
    </li>
  );
}
