import type { RefObject } from 'react';
import type { HistoricalObservation, Instrument } from '@/model';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ASSET_LABELS, RISK_LABELS } from '../instruments';
import type { LoadState } from '../instruments';
import { HISTORY_RANGES, historyForRange } from '../history';
import type { HistoryRange } from '../history';
import { formatMoney } from '../portfolio/money';
import type { TradePlan } from '../portfolio/portfolioReducer';
import { AmountField } from './AmountField';
import { MoneyValue } from './MoneyValue';
import { PriceChart } from './PriceChart';

interface InstrumentPanelProps {
  instrument: Instrument | null;
  history?: LoadState<HistoricalObservation[]>;
  range: HistoryRange;
  text: string;
  cents: number | null;
  currentCents: number;
  cashCents: number;
  basisCents: number;
  maxCents: number;
  error?: string;
  plan: TradePlan | null;
  returnFocusRef: RefObject<HTMLElement | null>;
  onRangeChange: (range: HistoryRange) => void;
  onTextChange: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onRetryHistory: (id: number) => void;
}

export function InstrumentPanel({
  instrument,
  history,
  range,
  text,
  cents,
  currentCents,
  cashCents,
  basisCents,
  maxCents,
  error,
  plan,
  returnFocusRef,
  onRangeChange,
  onTextChange,
  onClose,
  onSubmit,
  onRetryHistory,
}: InstrumentPanelProps) {
  let action = 'Update allocation';
  if (plan?.ok) {
    action =
      plan.kind === 'none'
        ? 'No changes'
        : plan.kind === 'remove'
          ? 'Remove position'
          : `${plan.kind === 'buy' ? 'Buy' : 'Sell'} ${formatMoney(Math.abs(plan.deltaCents))}`;
  }
  return (
    <Dialog
      open={instrument !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {instrument && (
        <DialogContent
          finalFocus={returnFocusRef}
          className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader className="pr-8">
            <DialogTitle className="break-words">{instrument.name}</DialogTitle>
            <DialogDescription>
              {instrument.description ??
                'Explore this instrument and choose its share of your portfolio.'}
            </DialogDescription>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Badge variant="secondary">{ASSET_LABELS[instrument.assetClass]}</Badge>
              <Badge>{RISK_LABELS[instrument.riskLevel]} risk</Badge>
              <Badge variant="secondary">{instrument.currency}</Badge>
            </div>
          </DialogHeader>
          <div className="flex min-w-0 flex-col gap-4">
            <ToggleGroup
              aria-label="Historical period"
              value={[range]}
              size="sm"
              variant="outline"
              onValueChange={(values) => {
                const next = values[0] as HistoryRange;
                if (HISTORY_RANGES.includes(next)) onRangeChange(next);
              }}
            >
              {HISTORY_RANGES.map((value) => (
                <ToggleGroupItem key={value} value={value}>
                  {value === 'ALL' ? 'All' : value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {!history || history.status === 'loading' ? (
              <div role="status">
                <span className="sr-only">Loading instrument history</span>
                <Skeleton className="h-48 w-full motion-reduce:animate-none" />
              </div>
            ) : history.status === 'error' ? (
              <Alert>
                <AlertTitle>History couldn’t be loaded</AlertTitle>
                <AlertDescription className="flex flex-col items-start gap-2">
                  <p>{history.message} You can still edit the allocation.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRetryHistory(instrument.id)}
                  >
                    Retry history
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <PriceChart points={historyForRange(history.data, range)} />
            )}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer py-1 focus-visible:outline-ring">
                About this historical data
              </summary>
              <p className="mt-2 leading-relaxed">
                Source: {instrument.historySource}. Dates shown are the original source dates, not
                live quotes. Index levels are not executable EUR prices. Past performance is not a
                forecast.
              </p>
              {instrument.historyDescription && (
                <p className="mt-2 leading-relaxed">{instrument.historyDescription}</p>
              )}
            </details>
          </div>
          <Separator />
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Currently allocated</dt>
                <dd>
                  <MoneyValue cents={currentCents} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Available cash</dt>
                <dd>
                  <MoneyValue cents={cashCents} />
                </dd>
              </div>
            </dl>
            <AmountField
              text={text}
              cents={cents}
              basisCents={basisCents}
              maxCents={maxCents}
              error={error}
              onTextChange={onTextChange}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!plan?.ok || plan.kind === 'none'}>
                {action}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
