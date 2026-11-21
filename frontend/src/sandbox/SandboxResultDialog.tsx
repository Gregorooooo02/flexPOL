import { CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useRef } from 'react';
import type { RefObject } from 'react';
import { cn } from 'cn';
import { hedgieImage } from '@/components/coach/hedgie';
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
import type { Scenario, ScenarioRunResponse } from '@/model';
import { formatEuros, formatShare } from '@/scenarios/format';
import { MoneyValue, SignedMoney } from '@/workspace/components/MoneyValue';
import { SignedChange } from '@/workspace/components/SignedChange';
import { CRITERION_TITLES, criterionDetail, rangeLine, suitableSummary } from './resultText';
import { StarRating } from './StarRating';

/** The popup shown when a run's replay ends: stars, why each was or wasn't earned, and the key numbers. */
export function SandboxResultDialog({
  open,
  scenario,
  run,
  previousStars,
  finalFocus,
  onOpenChange,
  onChangePlan,
  onAskCoach,
}: {
  open: boolean;
  scenario: Scenario;
  run: ScenarioRunResponse;
  previousStars: number | null;
  finalFocus: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onChangePlan: () => void;
  /** Closes the popup and asks Hedgie for feedback on this run. */
  onAskCoach: () => void;
}) {
  const { stars } = run;
  const gainCents = Math.round((run.finalValue + run.paidOut - run.budget) * 100);
  const shortfall = run.moneyNeeds.reduce((total, need) => total + need.shortfall, 0);
  const starChange = previousStars === null ? null : stars.stars - previousStars;
  // Open on the stars, not the first button (the footer's Close), so the popup starts at the top.
  const summaryRef = useRef<HTMLParagraphElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        initialFocus={summaryRef}
        finalFocus={finalFocus}
        className="max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] min-w-0 overflow-y-auto p-4 sm:max-w-2xl sm:p-6 [&>*]:min-w-0"
      >
        <DialogHeader className="pr-10">
          <DialogTitle>Result</DialogTitle>
          <DialogDescription className="[overflow-wrap:anywhere]">
            Scenario {scenario.code} · {scenario.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 text-center">
          <StarRating stars={stars.stars} size="lg" />
          <p ref={summaryRef} tabIndex={-1} className="font-heading text-xl font-semibold tabular-nums outline-none">
            {stars.stars} of 5 stars
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Badge variant="outline" className={run.goalMet ? 'text-gain' : 'text-loss'}>
              <HugeiconsIcon icon={run.goalMet ? CheckmarkCircle02Icon : CancelCircleIcon} strokeWidth={2} aria-hidden="true" />
              {run.goalMet ? 'Goal reached' : 'Goal not reached'}
            </Badge>
            {starChange !== null && (
              <span>
                Previous run: {previousStars} {previousStars === 1 ? 'star' : 'stars'}
                {starChange !== 0 && (
                  <span className={starChange > 0 ? 'text-gain' : 'text-loss'}>
                    {' '}
                    <span aria-hidden="true">{starChange > 0 ? '▲' : '▼'}</span> {starChange > 0 ? '+' : '−'}
                    {Math.abs(starChange)}
                  </span>
                )}
              </span>
            )}
          </div>
          {stars.earned === 0 && (
            <p className="text-xs text-muted-foreground">Every run earns at least one star.</p>
          )}
        </div>

        <ul role="list" className="flex flex-col divide-y divide-border border-y border-border">
          {stars.criteria.map((criterion) => (
            <li key={criterion.key} className="flex items-start gap-3 py-3">
              <HugeiconsIcon
                icon={criterion.earned ? CheckmarkCircle02Icon : CancelCircleIcon}
                strokeWidth={2}
                aria-hidden="true"
                className={cn('mt-0.5 size-5 shrink-0', criterion.earned ? 'text-gain' : 'text-loss')}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <h3 className="font-heading font-semibold">
                    <span className="sr-only">{criterion.earned ? 'Earned: ' : 'Missed: '}</span>
                    {CRITERION_TITLES[criterion.key]}
                  </h3>
                  <StarRating
                    stars={criterion.earned ? criterion.stars : 0}
                    max={criterion.stars}
                    size="sm"
                  />
                </div>
                <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  {criterionDetail(criterion.key, criterion.earned, run, scenario)}
                </p>
                {criterion.key === 'ASSETS' && (
                  <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{suitableSummary(run, scenario)}</p>
                )}
                {criterion.key === 'SHARES' && (
                  <ul role="list" className="mt-1 flex flex-col gap-1 text-xs">
                    {stars.shareRanges.map((range) => {
                      const line = rangeLine(range);
                      return (
                        <li key={range.label} className="flex flex-wrap items-center gap-x-2">
                          <HugeiconsIcon
                            icon={range.met ? CheckmarkCircle02Icon : CancelCircleIcon}
                            strokeWidth={2}
                            aria-hidden="true"
                            className={cn('size-3.5 shrink-0', range.met ? 'text-gain' : 'text-loss')}
                          />
                          <span className="sr-only">{range.met ? 'Inside: ' : 'Outside: '}</span>
                          <span className="font-medium text-foreground">{line.label}:</span>
                          <span className="tabular-nums">{line.value}</span>
                          <span className="text-muted-foreground">· right range {line.target}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>

        <section aria-label={`What fits ${scenario.persona.name}`} className="flex flex-col gap-1 border-l-2 border-primary bg-secondary/60 px-3 py-2">
          <h3 className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
            What fits {scenario.persona.name}
          </h3>
          <p className="text-sm leading-relaxed [overflow-wrap:anywhere]">{stars.explanation}</p>
        </section>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 [&>div]:min-w-0">
          <div>
            <dt className="text-xs text-muted-foreground">Final value</dt>
            <dd>
              <MoneyValue cents={Math.round(run.finalValue * 100)} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Gain incl. paid out</dt>
            <dd className="flex flex-col gap-0.5 text-sm">
              <SignedMoney cents={gainCents} />
              <SignedChange value={run.totalReturn} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Largest drop</dt>
            <dd className="text-sm">
              <span className="font-heading tabular-nums">{formatShare(run.largestDrop)}</span>
              <span className="block text-xs text-muted-foreground">
                {scenario.persona.name} can live with {formatShare(scenario.scoring.maxDrawdown)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Money needed</dt>
            <dd className="text-sm">
              {run.moneyNeeds.length === 0
                ? 'None'
                : shortfall > 0
                  ? `Short by ${formatEuros(shortfall)}`
                  : `All paid (${formatEuros(run.paidOut)})`}
            </dd>
          </div>
        </dl>

        <Separator />
        <p className="text-xs text-muted-foreground">
          One simulated path with synthetic prices. It illustrates the trade-offs from the lessons; it doesn&apos;t
          predict real returns and isn&apos;t investment advice.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" variant="outline" onClick={onAskCoach}>
            <img src={hedgieImage('hint')} alt="" aria-hidden="true" className="size-5" data-icon="inline-start" />
            Ask Hedgie for feedback
          </Button>
          <Button type="button" onClick={onChangePlan}>
            Change plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
