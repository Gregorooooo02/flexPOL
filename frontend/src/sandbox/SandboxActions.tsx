import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useId } from 'react';
import { Link } from 'react-router';
import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SIMULATION_DURATION_MS } from '@/playground/config';
import { scenarioPath } from '@/scenarios/routes';

export type SandboxPhase = 'planning' | 'submitting' | 'playing' | 'finished';

export function SandboxActions({
  scenarioId,
  phase,
  canRun,
  hasHoldings,
  failed,
  unavailableReason,
  onRun,
  onChangePlan,
  onShowResult,
}: {
  scenarioId: number;
  phase: SandboxPhase;
  /** False while the catalogue loads or a dialog is open. */
  canRun: boolean;
  hasHoldings: boolean;
  failed: boolean;
  unavailableReason?: string;
  onRun: () => void;
  onChangePlan: () => void;
  onShowResult: () => void;
}) {
  const hintId = useId();
  const seconds = SIMULATION_DURATION_MS / 1000;
  const help =
    phase === 'finished'
      ? 'Change the plan and run it again on the same market to compare.'
      : phase === 'submitting'
        ? 'Simulating the scenario’s market…'
        : phase === 'playing'
          ? `Your plan is locked. The full horizon plays in ${seconds} seconds.`
          : (unavailableReason ??
            (hasHoldings
              ? `One decision: the plan is locked while it runs. The full horizon plays in ${seconds} seconds.`
              : 'Nothing invested yet: running now keeps the whole budget in cash.'));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
      <Link
        to={scenarioPath(scenarioId)}
        className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3 justify-self-start' })}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
        Brief
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {phase === 'finished' ? (
          <>
            <Button type="button" variant="outline" onClick={onShowResult}>
              See result
            </Button>
            <Button type="button" onClick={onChangePlan}>
              Change plan
            </Button>
          </>
        ) : phase === 'planning' ? (
          <Button type="button" disabled={!canRun} aria-describedby={hintId} onClick={onRun}>
            {failed ? 'Try again' : 'Run simulation'}
          </Button>
        ) : (
          <Button type="button" disabled>
            <Spinner data-icon="inline-start" aria-hidden="true" className="motion-reduce:animate-none" />
            Running…
          </Button>
        )}
      </div>
      <p id={hintId} className="col-span-2 text-xs text-muted-foreground [overflow-wrap:anywhere]">
        {help}
      </p>
    </div>
  );
}
