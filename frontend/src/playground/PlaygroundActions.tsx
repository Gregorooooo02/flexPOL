import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
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
  const cannotStart = !ready || blocked || needsAllocation || Boolean(unavailableReason);
  const help =
    unavailableReason ??
    (needsAllocation
      ? `Add at least one instrument to start a ${SIMULATION_DURATION_MS / 1000}-second simulation.`
      : market.status === 'loading'
        ? 'Preparing the simulated market. You can build your portfolio while you wait.'
        : `The full horizon plays in ${SIMULATION_DURATION_MS / 1000} seconds and cannot be paused.`);
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1">
      <FieldGroup className="min-w-0 max-w-72">
        <ChoiceField
          label="Horizon"
          orientation="horizontal"
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
          <Button type="button" onClick={onStartOver}>
            Start over
          </Button>
        ) : market.status === 'error' && !unavailableReason ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            Retry market
          </Button>
        ) : (
          <>
            {replay.status === 'playing' ? (
              <Button type="button" disabled>
                <Spinner
                  data-icon="inline-start"
                  aria-hidden="true"
                  className="motion-reduce:animate-none"
                />
                Running…
              </Button>
            ) : (
              <Button
                type="button"
                disabled={cannotStart}
                aria-describedby={needsAllocation ? hintId : undefined}
                onClick={onPlay}
              >
                {!ready && !unavailableReason && <Spinner data-icon="inline-start" />}
                Start
              </Button>
            )}
          </>
        )}
      </div>
      {!finished && (
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
