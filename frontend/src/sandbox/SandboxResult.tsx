import { CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Ref } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Scenario, ScenarioRunResponse } from '@/model';
import { formatEuros, formatShare } from '@/scenarios/format';
import { MoneyValue, SignedMoney } from '@/workspace/components/MoneyValue';
import { SignedChange } from '@/workspace/components/SignedChange';

/** The scored result of a finished run, with the previous run's score when the learner retried. */
export function SandboxResult({
  scenario,
  run,
  previousScore,
  titleRef,
}: {
  scenario: Scenario;
  run: ScenarioRunResponse;
  previousScore: number | null;
  titleRef?: Ref<HTMLHeadingElement>;
}) {
  const { score } = run;
  const shortfalls = run.moneyNeeds.filter((need) => need.shortfall > 0);
  const gainCents = Math.round((run.finalValue + run.paidOut - run.budget) * 100);
  const scoreChange = previousScore === null ? null : score.total - previousScore;

  return (
    <Card size="sm" className="border border-primary/40 bg-card py-5">
      <CardHeader className="px-5">
        <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 ref={titleRef} tabIndex={-1} className="outline-none">
            Result
          </h2>
          <Badge variant="outline" className={run.goalMet ? 'text-gain' : 'text-loss'}>
            <HugeiconsIcon
              icon={run.goalMet ? CheckmarkCircle02Icon : CancelCircleIcon}
              strokeWidth={2}
              aria-hidden="true"
            />
            {run.goalMet ? 'Goal reached' : 'Goal not reached'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Scored on {scenario.persona.name}&apos;s market, which is the same for every learner and every retry.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-5">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <p className="flex items-baseline gap-1">
            <span className="font-heading text-4xl font-semibold tabular-nums">{score.total}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            <span className="sr-only">points</span>
          </p>
          {scoreChange !== null && (
            <p className="text-xs text-muted-foreground">
              Previous run: <span className="font-heading tabular-nums">{previousScore}</span>
              {scoreChange !== 0 && (
                <span className={scoreChange > 0 ? 'text-gain' : 'text-loss'}>
                  {' '}
                  <span aria-hidden="true">{scoreChange > 0 ? '▲' : '▼'}</span> {scoreChange > 0 ? '+' : '−'}
                  {Math.abs(scoreChange)}
                </span>
              )}
            </p>
          )}
        </div>

        <dl className="grid gap-4 sm:grid-cols-3 [&>div]:min-w-0">
          <ScorePart
            label={`Growth · ${formatShare(score.growthWeight)} of the score`}
            value={`${score.growth} / 100`}
            detail={
              shortfalls.length > 0
                ? 'No growth points: a payment couldn’t be made in full.'
                : `Full points from ${formatEuros(scenario.scoring.target)}, none at ${formatEuros(scenario.scoring.floor)}.`
            }
          />
          <ScorePart
            label={`Stability · ${formatShare(score.stabilityWeight)} of the score`}
            value={`${score.stability} / 100`}
            detail={`Largest drop ${formatShare(run.largestDrop)}; ${scenario.persona.name} can live with ${formatShare(scenario.scoring.maxDrawdown)}.`}
          />
          <ScorePart
            label="Rules"
            value={score.rulePenalty > 0 ? `−${score.rulePenalty} points` : 'No penalty'}
            detail={
              score.brokenRules.length > 0
                ? `Broken: ${score.brokenRules.join('; ')}.`
                : scenario.rules.length > 0
                  ? 'Every rule was kept.'
                  : 'This scenario has no extra rules.'
            }
          />
        </dl>

        <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3 [&>div]:min-w-0">
          <div>
            <dt className="text-xs text-muted-foreground">Final value</dt>
            <dd>
              <MoneyValue cents={Math.round(run.finalValue * 100)} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Gain incl. money paid out</dt>
            <dd className="flex flex-col gap-1 text-sm">
              <SignedMoney cents={gainCents} />
              <SignedChange value={run.totalReturn} />
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-muted-foreground">Money needed along the way</dt>
            <dd className="text-sm">
              {run.moneyNeeds.length === 0
                ? 'None'
                : shortfalls.length === 0
                  ? `All paid (${formatEuros(run.paidOut)})`
                  : `Short by ${formatEuros(shortfalls.reduce((total, need) => total + need.shortfall, 0))}`}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">
          One simulated path with synthetic prices. It illustrates the trade-offs from the lessons; it
          doesn&apos;t predict real returns and isn&apos;t investment advice.
        </p>
      </CardContent>
    </Card>
  );
}

function ScorePart({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-lg font-semibold tabular-nums">{value}</dd>
      <dd className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{detail}</dd>
    </div>
  );
}
