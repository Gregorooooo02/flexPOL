import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChoiceField } from '@/workspace/components/ChoiceField';
import type { LoadState } from '@/workspace/instruments';
import { HORIZONS, SIMULATION_DURATION_MS } from './config';
import type { MarketTape } from './marketTape';
import type { ReplayState } from './replay';

export function PlaygroundActions({
  market,
  replay,
  horizonYears,
  blocked,
  needsAllocation,
  unavailableReason,
  onHorizonChange,
  onPlay,
  onRetry,
  onStartOver,
}: {
  market: LoadState<MarketTape>;
  replay: ReplayState;
  horizonYears: number;
  blocked: boolean;
  needsAllocation: boolean;
  unavailableReason?: string;
  onHorizonChange: (years: number) => void;
  onPlay: () => void;
  onRetry: () => void;
  onStartOver: () => void;
}) {
  const ready = market.status === 'ready';
  const finished = replay.status === 'finished';
  const hintId = useId();
  const [allocationHintOpen, setAllocationHintOpen] = useState(false);
  const cannotStart = !ready || blocked || needsAllocation || Boolean(unavailableReason);
  const help =
    unavailableReason ??
    (needsAllocation
      ? `Add at least one instrument to start a ${SIMULATION_DURATION_MS / 1000}-second simulation.`
      : `The full horizon plays in ${SIMULATION_DURATION_MS / 1000} seconds and cannot be paused.`);
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1">
      <FieldGroup className="w-fit min-w-0">
        <ChoiceField
          label="Horizon"
          orientation="horizontal"
          width="content"
          value={String(horizonYears)}
          disabled={replay.status !== 'idle'}
          options={HORIZONS.map((horizon) => ({
            value: String(horizon.years),
            label: `${horizon.years} ${horizon.years === 1 ? 'year' : 'years'}`,
          }))}
          onChange={(value) => onHorizonChange(Number(value))}
        />
      </FieldGroup>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {finished ? (
          <Button type="button" className="w-28" onClick={onStartOver}>
            Start over
          </Button>
        ) : market.status === 'error' && !unavailableReason ? (
          <Button type="button" variant="outline" className="w-28" onClick={onRetry}>
            Retry market
          </Button>
        ) : (
          <>
            {replay.status === 'playing' ? (
              <Button type="button" className="w-28" disabled>
                <Spinner
                  data-icon="inline-start"
                  aria-hidden="true"
                  className="motion-reduce:animate-none"
                />
                Running…
              </Button>
            ) : needsAllocation && !unavailableReason ? (
              <TooltipProvider>
                <Tooltip open={allocationHintOpen} onOpenChange={setAllocationHintOpen}>
                  <TooltipTrigger
                    render={<span className="inline-flex" />}
                    closeOnClick={false}
                    role="button"
                    tabIndex={0}
                    aria-label="Start simulation"
                    aria-describedby={hintId}
                    onClick={() => setAllocationHintOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setAllocationHintOpen(true);
                      }
                    }}
                  >
                    <Button type="button" disabled aria-hidden="true" className="pointer-events-none w-28">
                      {!ready && <Spinner data-icon="inline-start" aria-label="Preparing market" />}
                      Start
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{help}</TooltipContent>
                </Tooltip>
                <span id={hintId} className="sr-only">{help}</span>
              </TooltipProvider>
            ) : (
              <Button
                type="button"
                className="w-28"
                disabled={cannotStart}
                aria-busy={market.status === 'loading'}
                onClick={onPlay}
              >
                {!ready && !unavailableReason && (
                  <Spinner data-icon="inline-start" aria-label="Preparing market" />
                )}
                Start
              </Button>
            )}
          </>
        )}
      </div>
      {!finished && (!needsAllocation || unavailableReason) && (
        <p
          id={hintId}
          className="col-span-2 text-xs text-muted-foreground [overflow-wrap:anywhere]"
        >
          {help}
        </p>
      )}
    </div>
  );
}
