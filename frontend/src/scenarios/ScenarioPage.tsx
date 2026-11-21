import {
  Alert02Icon,
  ArrowLeft01Icon,
  BookOpen01Icon,
  CheckListIcon,
  ChartLineData01Icon,
  InformationCircleIcon,
  Money03Icon,
  PlayIcon,
  RefreshIcon,
  Target02Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { IconSvgElement } from '@hugeicons/react';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { getScenario } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/config/axios';
import type { AssetClass, Scenario } from '@/model';
import { RISK_LABELS } from '@/workspace/instruments';
import { formatDayCount, formatDays, formatEuros, formatShare } from './format';
import { StarRating } from '@/sandbox/StarRating';
import { parseScenarioId, scenarioPlayPath } from './routes';

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'not-found' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly scenario: Scenario };

const ASSET_LABEL: Record<AssetClass, string> = {
  STOCK: 'Single stock',
  EQUITY_ETF: 'ETF',
  DEPOSIT: 'Deposit',
};

/** `/scenarios/:scenarioId`: one scenario's brief and the button that starts it. */
export function ScenarioPage() {
  const { scenarioId } = useParams();
  const id = parseScenarioId(scenarioId);
  // A new id remounts the detail, so its load state starts fresh.
  return id === null ? <ScenarioNotFound /> : <ScenarioDetail key={id} scenarioId={id} />;
}

function ScenarioDetail({ scenarioId }: { readonly scenarioId: number }) {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getScenario(scenarioId, controller.signal)
      .then((scenario) => setLoadState({ status: 'ready', scenario }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.isNotFound) {
          setLoadState({ status: 'not-found' });
          return;
        }
        setLoadState({
          status: 'error',
          message: error instanceof ApiError ? error.message : 'Unknown error.',
        });
      });
    return () => controller.abort();
  }, [scenarioId, reloadKey]);

  const handleRetry = useCallback(() => {
    setLoadState({ status: 'loading' });
    setReloadKey((key) => key + 1);
  }, []);

  switch (loadState.status) {
    case 'loading':
      return <LoadingBrief />;
    case 'not-found':
      return <ScenarioNotFound />;
    case 'error':
      return (
        <PageShell>
          <MessageCard
            title="Couldn't load the scenario"
            description={`${loadState.message} Check that the backend is running on port 8080.`}
          >
            <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
              Try again
            </Button>
          </MessageCard>
        </PageShell>
      );
    case 'ready':
      return <ScenarioBrief scenario={loadState.scenario} />;
  }
}

function ScenarioBrief({ scenario }: { readonly scenario: Scenario }) {
  const { persona, scoring } = scenario;
  const instrumentNames = new Map(scenario.instruments.map((instrument) => [instrument.id, instrument.name]));
  const hasMoneyNeeds = scenario.moneyNeeds.length > 0;

  return (
    <PageShell>
      <header className="flex flex-col gap-5 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Badge className="bg-primary px-2 py-0.5 text-primary-foreground tabular-nums">{scenario.code}</Badge>
            <Badge variant="secondary" className="max-w-full whitespace-normal">
              Chapter {scenario.chapterNumber} · {scenario.chapterTitle}
            </Badge>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
            {scenario.title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            <span className="font-semibold text-foreground">
              {persona.name}
              {persona.age !== null && `, ${persona.age}`}
            </span>
            {persona.situation && ` · ${persona.situation}`}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1.5 @3xl:items-end">
          <Link
            to={scenarioPlayPath(scenario.id)}
            aria-describedby="scenario-start-note"
            className={buttonVariants({ size: 'lg' })}
          >
            <HugeiconsIcon icon={PlayIcon} strokeWidth={2} data-icon="inline-start" />
            Start scenario
          </Link>
          <p id="scenario-start-note" className="text-xs text-muted-foreground">
            Build a portfolio, then run it in {persona.name}&apos;s market.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-1 border-l-2 border-primary bg-secondary/60 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
          <HugeiconsIcon icon={Target02Icon} className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Goal
        </p>
        <p className="text-base leading-snug text-foreground [overflow-wrap:anywhere]">{scenario.goal}</p>
      </div>

      <dl className="grid grid-cols-2 gap-px border border-border bg-border @3xl:grid-cols-4">
        <Fact label="Budget" value={formatEuros(scenario.budget)} detail="Virtual money" />
        <Fact
          label="Horizon"
          value={capitalize(formatDays(scenario.durationDays))}
          detail={formatDayCount(scenario.durationDays)}
        />
        <Fact
          label="Money needed"
          value={hasMoneyNeeds ? formatEuros(sum(scenario.moneyNeeds.map((need) => need.amount))) : 'None'}
          detail={
            hasMoneyNeeds
              ? `${scenario.moneyNeeds.length} ${scenario.moneyNeeds.length === 1 ? 'payment' : 'payments'} before the end`
              : 'Nothing before the end'
          }
        />
        {scenario.retirementGap !== null ? (
          <Fact label="Retirement gap" value={formatEuros(scenario.retirementGap)} detail="The result shows how much is covered" />
        ) : (
          <Fact
            label="Instruments"
            value={`${scenario.instruments.length} + cash`}
            detail="Unallocated money stays as cash"
          />
        )}
      </dl>

      <div className="grid gap-4 @3xl:grid-cols-2">
        <Section icon={Money03Icon} title="Money needed along the way">
          {hasMoneyNeeds ? (
            <>
              <ul role="list" className="flex flex-col divide-y divide-border">
                {scenario.moneyNeeds.map((need) => (
                  <li key={`${need.day}-${need.label}`} className="flex items-baseline justify-between gap-3 py-2">
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      <span className="font-medium text-foreground">{need.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        Day {need.day} · after {formatDays(need.day)}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">{formatEuros(need.amount)}</span>
                  </li>
                ))}
              </ul>
              <Note>Paid from cash first, then by selling holdings at that day&apos;s value.</Note>
            </>
          ) : (
            <p className="text-muted-foreground">
              {persona.name} doesn&apos;t need any of the money before the end of the scenario.
            </p>
          )}
        </Section>

        <Section icon={Wallet01Icon} title="What you can use">
          <ul role="list" className="flex flex-col divide-y divide-border">
            <li className="flex items-baseline justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="font-medium text-foreground">Cash</span>
                <span className="block text-xs text-muted-foreground">Earns 0% and never moves</span>
              </span>
              <Badge variant="secondary">Always available</Badge>
            </li>
            {scenario.instruments.map((instrument) => (
              <li key={instrument.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="font-medium text-foreground">{instrument.name}</span>
                  <span className="block text-xs text-muted-foreground">{ASSET_LABEL[instrument.assetClass]}</span>
                </span>
                <Badge variant="secondary">{RISK_LABELS[instrument.riskLevel]} risk</Badge>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={CheckListIcon} title="Rules">
          {scenario.rules.length > 0 ? (
            <>
              <ul role="list" className="flex flex-col gap-3">
                {scenario.rules.map((rule) => (
                  <li key={`${rule.type}-${rule.label}`} className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground [overflow-wrap:anywhere]">{rule.label}</span>
                    <span className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                      {rule.type === 'MAX_TOTAL_SHARE' ? 'Together at most ' : 'Each at most '}
                      {formatShare(rule.maxShare)} of the budget:{' '}
                      {rule.instrumentIds.map((id) => instrumentNames.get(id) ?? `#${id}`).join(', ')}
                    </span>
                  </li>
                ))}
              </ul>
              <Note>
                Rules are advice, not limits: you can break one, but it costs a star.
              </Note>
            </>
          ) : (
            <p className="text-muted-foreground">No extra rules. Split the budget however you think fits the goal.</p>
          )}
        </Section>

        <Section icon={ChartLineData01Icon} title="How you're scored">
          <ul role="list" className="flex flex-col gap-3">
            <ScoreStar stars={2} title="Growth">
              End with more than {formatEuros(scenario.budget)}, counting money paid out along the way.
            </ScoreStar>
            <ScoreStar stars={1} title="Goal">
              End with at least {formatEuros(scoring.target)}
              {hasMoneyNeeds ? ' and pay every bill in full on time.' : '.'}
            </ScoreStar>
            <ScoreStar stars={1} title="Right instruments">
              Pick instruments that suit {persona.name}&apos;s situation. Cash is always fine.
            </ScoreStar>
            <ScoreStar stars={1} title="Right shares">
              Split the money between cash and investments in proportions that fit the goal and horizon. There&apos;s a
              range, not one right number.
            </ScoreStar>
          </ul>
          <Note>
            Up to five stars, and every run earns at least one. Which instruments and ranges fit is revealed with your
            result.
          </Note>
        </Section>
      </div>

      <div className="grid gap-4 @3xl:grid-cols-2">
        {scenario.lessons.length > 0 && (
          <Section icon={BookOpen01Icon} title="Lessons it practises">
            <ul role="list" className="flex flex-col gap-1.5">
              {scenario.lessons.map((lesson) => (
                <li key={lesson.id} className="[overflow-wrap:anywhere]">
                  <span className="font-medium text-foreground tabular-nums">{lesson.code}</span> {lesson.title}
                </li>
              ))}
            </ul>
            <Link to="/learning" className={buttonVariants({ variant: 'link', size: 'xs', className: 'self-start px-0' })}>
              Go to Learning
            </Link>
          </Section>
        )}

        {scenario.notSimulated.length > 0 && (
          <Section icon={InformationCircleIcon} title="Not part of this simulation">
            <ul role="list" className="flex list-disc flex-col gap-1.5 pl-4 text-muted-foreground">
              {scenario.notSimulated.map((item) => (
                <li key={item} className="[overflow-wrap:anywhere]">
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={Alert02Icon} className="mt-px size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
        The person, goal and prices are fictional. Results illustrate the lessons; they don&apos;t predict real returns
        and aren&apos;t investment advice.
      </p>
    </PageShell>
  );
}

function PageShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="@container flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <Link
          to="/scenarios"
          className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3 self-start' })}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
          All scenarios
        </Link>
        {children}
      </div>
    </div>
  );
}

function Fact({ label, value, detail }: { readonly label: string; readonly value: string; readonly detail: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 bg-card px-4 py-3">
      <dt className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">{label}</dt>
      <dd className="font-heading text-lg font-semibold tabular-nums [overflow-wrap:anywhere]">{value}</dd>
      <dd className="text-xs text-muted-foreground">{detail}</dd>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  readonly icon: IconSvgElement;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <Card size="sm" className="gap-3 border border-border bg-card py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <HugeiconsIcon icon={icon} className="size-4 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 text-sm">{children}</CardContent>
    </Card>
  );
}

function ScoreStar({ stars, title, children }: { readonly stars: number; readonly title: string; readonly children: ReactNode }) {
  return (
    <li className="flex flex-col gap-0.5">
      <span className="flex flex-wrap items-center gap-2 font-medium text-foreground">
        {title}
        <StarRating stars={stars} max={stars} size="sm" />
      </span>
      <span className="text-xs text-muted-foreground">{children}</span>
    </li>
  );
}

function Note({ children }: { readonly children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>;
}

function MessageCard({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex justify-center py-6">
      <Card size="sm" className="w-full max-w-md border border-border bg-card py-5" role="alert">
        <CardHeader className="items-center px-5 text-center">
          <CardTitle className="normal-case tracking-normal">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center px-5 pt-2">{children}</CardContent>
      </Card>
    </div>
  );
}

function ScenarioNotFound() {
  return (
    <PageShell>
      <MessageCard title="Scenario not found" description="This scenario doesn't exist, or it has been removed.">
        <Link to="/scenarios" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Browse scenarios
        </Link>
      </MessageCard>
    </PageShell>
  );
}

function LoadingBrief() {
  return (
    <PageShell>
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="sr-only">Loading scenario…</span>
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-20" aria-hidden="true" />
        <Skeleton className="h-24" aria-hidden="true" />
        <div className="grid gap-4 @3xl:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
