import { memo, useEffect, useRef } from 'react';
import type { HistoricalObservation, Instrument } from '@/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ASSET_LABELS, RISK_LABELS } from '../instruments';
import type { LoadState } from '../instruments';
import { historyForRange, pastYearChange } from '../history';
import { formatPercent } from '../portfolio/money';
import { MoneyValue } from './MoneyValue';
import { SignedChange } from './SignedChange';
import { Sparkline } from './Sparkline';

interface InstrumentRowProps {
  instrument: Instrument;
  allocatedCents: number;
  history?: LoadState<HistoricalObservation[]>;
  onRequestHistory: (id: number) => void;
  onRetryHistory: (id: number) => void;
  onOpen: (id: number, trigger: HTMLElement) => void;
}

export const InstrumentRow = memo(function InstrumentRow({
  instrument,
  allocatedCents,
  history,
  onRequestHistory,
  onRetryHistory,
  onOpen,
}: InstrumentRowProps) {
  const rowRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    if (!('IntersectionObserver' in window)) {
      onRequestHistory(instrument.id);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onRequestHistory(instrument.id);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, [instrument.id, onRequestHistory]);

  const points = history?.status === 'ready' ? history.data : [];
  const volatility = instrument.simulationConfiguration?.parameters.annualVolatility;
  const available = instrument.currency === 'EUR' && instrument.simulationConfiguration !== null;
  return (
    <li ref={rowRef}>
      <div className="flex flex-col gap-3 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="font-heading font-semibold break-words">{instrument.name}</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Badge variant="secondary">{ASSET_LABELS[instrument.assetClass]}</Badge>
              <Badge variant="outline">{RISK_LABELS[instrument.riskLevel]} risk</Badge>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant={allocatedCents > 0 ? 'outline' : 'secondary'}
            disabled={!available}
            aria-label={`${allocatedCents > 0 ? 'Edit' : 'Add'} position: ${instrument.name}`}
            onClick={(event) => onOpen(instrument.id, event.currentTarget)}
          >
            {allocatedCents > 0 ? 'Edit' : 'Add'}
          </Button>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Past 1Y · not a forecast</span>
            {!history || history.status === 'loading' ? (
              <Skeleton
                className="h-4 w-20 motion-reduce:animate-none"
                aria-label="Loading history"
              />
            ) : history.status === 'error' ? (
              <Button
                type="button"
                variant="link"
                size="xs"
                onClick={() => onRetryHistory(instrument.id)}
                aria-label={`Retry history for ${instrument.name}`}
              >
                Retry history
              </Button>
            ) : (
              <SignedChange value={pastYearChange(points)} />
            )}
          </div>
          {points.length > 1 && <Sparkline points={historyForRange(points, '1Y')} />}
          <div className="flex flex-col gap-1 text-right">
            {allocatedCents > 0 ? (
              <>
                <span className="text-muted-foreground">Your allocation</span>
                <MoneyValue cents={allocatedCents} />
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Annual volatility</span>
                <span className="font-heading tabular-nums">
                  {typeof volatility === 'number' && Number.isFinite(volatility) && volatility >= 0
                    ? formatPercent(volatility)
                    : 'Unavailable'}
                </span>
              </>
            )}
          </div>
        </div>
        {!available && (
          <p className="text-xs text-muted-foreground">Not available in this EUR simulation.</p>
        )}
      </div>
      <Separator />
    </li>
  );
});
