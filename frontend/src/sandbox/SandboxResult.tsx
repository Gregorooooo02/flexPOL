import { CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Ref } from 'react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { hedgieImage } from '@/components/coach/hedgie';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScenarioRunResponse } from '@/model';
import { CRITERION_TITLES } from './resultText';
import { StarRating } from './StarRating';

/**
 * What stays on the page after the result popup closes: the stars, each criterion, a way back in,
 * and a way to ask Hedgie for feedback on the run.
 */
export function SandboxResult({
  run,
  titleRef,
  onOpenDetails,
  onAskCoach,
}: {
  run: ScenarioRunResponse;
  titleRef?: Ref<HTMLHeadingElement>;
  onOpenDetails: () => void;
  onAskCoach: () => void;
}) {
  const { stars } = run;
  return (
    <Card size="sm" className="border border-primary/40 bg-card py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 ref={titleRef} tabIndex={-1} className="outline-none">
            Result
          </h2>
          <StarRating stars={stars.stars} />
          <span className="text-sm font-normal tracking-normal normal-case text-muted-foreground">
            {stars.stars} of 5 · {run.goalMet ? 'goal reached' : 'goal not reached'}
          </span>
        </CardTitle>
        <CardDescription>Same market for every learner and every retry, so plans compare fairly.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4">
        <ul role="list" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {stars.criteria.map((criterion) => (
            <li key={criterion.key} className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={criterion.earned ? CheckmarkCircle02Icon : CancelCircleIcon}
                strokeWidth={2}
                aria-hidden="true"
                className={cn('size-4 shrink-0', criterion.earned ? 'text-gain' : 'text-loss')}
              />
              <span className="sr-only">{criterion.earned ? 'Earned: ' : 'Missed: '}</span>
              {CRITERION_TITLES[criterion.key]}
              <span className="text-xs text-muted-foreground">
                ({criterion.stars} {criterion.stars === 1 ? 'star' : 'stars'})
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onOpenDetails}>
            See full result
          </Button>
          <Button type="button" size="sm" onClick={onAskCoach}>
            <img src={hedgieImage('hint')} alt="" aria-hidden="true" className="size-5" data-icon="inline-start" />
            Ask Hedgie for feedback
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
