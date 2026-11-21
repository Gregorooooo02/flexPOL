import { RefreshIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { getInstrumentHistory, getInstruments, getScenario, runScenario } from '@/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/config/axios';
import { useAskCoach, usePublishCoachFocus } from '@/components/coach/coachFocus';
import type {
  HistoricalObservation,
  Instrument,
  Scenario,
  ScenarioAllocation,
  ScenarioMoneyNeedRun,
  ScenarioRunResponse,
} from '@/model';
import { SIMULATION_DURATION_MS } from '@/playground/config';
import { advanceReplay, createReplay } from '@/playground/replay';
import type { ReplayState } from '@/playground/replay';
import { parseScenarioId } from '@/scenarios/routes';
import { WorkspaceLayout } from '@/workspace/WorkspaceLayout';
import { AllocationBar } from '@/workspace/components/AllocationBar';
import { InstrumentList } from '@/workspace/components/InstrumentList';
import { InstrumentPanel } from '@/workspace/components/InstrumentPanel';
import { PortfolioList } from '@/workspace/components/PortfolioList';
import { ValueChart } from '@/workspace/components/ValueChart';
import { prepareHistory } from '@/workspace/history';
import type { HistoryRange } from '@/workspace/history';
import type { InstrumentFilters, LoadState } from '@/workspace/instruments';
import { formatMoney, parseAmountInput } from '@/workspace/portfolio/money';
import {
  createPortfolio,
  maxPositionCents,
  planPosition,
  portfolioReducer,
  positionValueCents,
} from '@/workspace/portfolio/portfolioReducer';
import { checkRules } from './rules';
import { buildRunTimeline } from './runTimeline';
import type { RunTimeline } from './runTimeline';
import { SandboxActions } from './SandboxActions';
import type { SandboxPhase } from './SandboxActions';
import { SandboxBrief } from './SandboxBrief';
import { SandboxHeader } from './SandboxHeader';
import { SandboxResult } from './SandboxResult';
import { SandboxResultDialog } from './SandboxResultDialog';
import { JourneyHandoffCard } from '@/journey/JourneyHandoffCard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DEFAULT_FILTERS: InstrumentFilters = { search: '', assetClass: 'ALL', risk: 'ALL' };
/** What "Ask Hedgie for feedback" sends for the learner after a run. */
const FEEDBACK_REQUEST = 'Give me feedback on my plan and this result';
/** Before a run every price is 1, so a holding's units are its cents (as in the Playground). */
const PLANNING_PRICE = 1;

type ScenarioState =
  | { readonly status: 'loading' }
  | { readonly status: 'not-found' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly scenario: Scenario };

type RunState =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly data: ScenarioRunResponse; readonly timeline: RunTimeline };

/** `/scenarios/:scenarioId/play`: the Sandbox mode of the investing workspace for one scenario. */
export function SandboxPage() {
  const { scenarioId } = useParams();
  const id = parseScenarioId(scenarioId);
  return id === null ? <ScenarioNotFound /> : <SandboxLoader key={id} scenarioId={id} />;
}

function SandboxLoader({ scenarioId }: { readonly scenarioId: number }) {
  const [state, setState] = useState<ScenarioState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getScenario(scenarioId, controller.signal)
      .then((scenario) => setState({ status: 'ready', scenario }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState(
          error instanceof ApiError && error.isNotFound
            ? { status: 'not-found' }
            : { status: 'error', message: error instanceof ApiError ? error.message : 'Unknown error.' },
        );
      });
    return () => controller.abort();
  }, [scenarioId, reloadKey]);

  switch (state.status) {
    case 'loading':
      return (
        <div role="status" className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6">
          <span className="sr-only">Loading scenario…</span>
          <Skeleton className="h-28" aria-hidden="true" />
          <Skeleton className="h-40" aria-hidden="true" />
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]" aria-hidden="true">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      );
    case 'not-found':
      return <ScenarioNotFound />;
    case 'error':
      return (
        <MessageCard title="Couldn't load the scenario" description={`${state.message} Check that the backend is running.`}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setState({ status: 'loading' });
              setReloadKey((key) => key + 1);
            }}
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
            Try again
          </Button>
        </MessageCard>
      );
    case 'ready':
      return <SandboxWorkspace scenario={state.scenario} />;
  }
}

/**
 * The learner plans with the Playground's workspace parts (catalogue limited to the scenario's
 * instruments, the scenario's budget, no horizon picker), then runs the plan once. The server
 * simulates the scenario's own market and scores it; the page replays the returned path in the
 * Playground's fixed ten seconds. Like the Playground, all state lives in this page.
 */
function SandboxWorkspace({ scenario }: { readonly scenario: Scenario }) {
  const budgetCents = Math.round(scenario.budget * 100);
  const [portfolio, dispatch] = useReducer(portfolioReducer, budgetCents, createPortfolio);
  const [catalogue, setCatalogue] = useState<LoadState<Instrument[]>>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState<InstrumentFilters>(DEFAULT_FILTERS);
  const [histories, setHistories] = useState<Record<number, LoadState<HistoricalObservation[]>>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('0.00');
  const [historyRange, setHistoryRange] = useState<HistoryRange>('1Y');
  const [chartView, setChartView] = useState<'history' | 'simulation'>('history');
  const [run, setRun] = useState<RunState>({ status: 'idle' });
  const [replay, setReplay] = useState<ReplayState>(createReplay);
  const [previousStars, setPreviousStars] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const replayRef = useRef(replay);
  const replayStartedAt = useRef(0);
  const runRequest = useRef<AbortController | null>(null);
  const historyRequests = useRef(new Map<number, AbortController>());
  const requestedHistoryIds = useRef(new Set<number>());
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const portfolioTitleRef = useRef<HTMLHeadingElement | null>(null);
  const pageTitleRef = useRef<HTMLHeadingElement | null>(null);
  const resultTitleRef = useRef<HTMLHeadingElement | null>(null);

  const updateReplay = useCallback((next: ReplayState) => {
    replayRef.current = next;
    setReplay(next);
  }, []);

  // Only the scenario's instruments, in the scenario's order.
  useEffect(() => {
    const controller = new AbortController();
    getInstruments(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        const byId = new Map(data.map((instrument) => [instrument.id, instrument]));
        setCatalogue({
          status: 'ready',
          data: scenario.instruments.flatMap(({ id }) => byId.get(id) ?? []),
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setCatalogue({
            status: 'error',
            message: error instanceof ApiError ? error.message : 'Something went wrong while loading instruments.',
          });
      });
    return () => controller.abort();
  }, [scenario, reloadKey]);

  useEffect(() => {
    const requests = historyRequests.current;
    const requestedIds = requestedHistoryIds.current;
    return () => {
      runRequest.current?.abort();
      requests.forEach((controller) => controller.abort());
      requests.clear();
      requestedIds.clear();
    };
  }, []);

  const loadHistory = useCallback((id: number, retry = false) => {
    if (historyRequests.current.has(id) || (!retry && requestedHistoryIds.current.has(id))) return;
    requestedHistoryIds.current.add(id);
    const controller = new AbortController();
    historyRequests.current.set(id, controller);
    setHistories((previous) => ({ ...previous, [id]: { status: 'loading' } }));
    getInstrumentHistory(id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setHistories((previous) => ({ ...previous, [id]: { status: 'ready', data: prepareHistory(data) } }));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setHistories((previous) => ({
            ...previous,
            [id]: {
              status: 'error',
              message: error instanceof ApiError ? error.message : 'History could not be loaded.',
            },
          }));
      })
      .finally(() => {
        if (historyRequests.current.get(id) === controller) historyRequests.current.delete(id);
      });
  }, []);
  const retryHistory = useCallback((id: number) => loadHistory(id, true), [loadHistory]);

  const timeline = run.status === 'ready' ? run.timeline : null;

  // Replay clock: absolute elapsed time (as in the Playground), so hidden tabs catch up instead of pausing.
  useEffect(() => {
    if (replay.status !== 'playing' || !timeline) return;
    const tick = () => {
      const current = replayRef.current;
      const next = advanceReplay(current, performance.now() - replayStartedAt.current, timeline.lastIndex);
      if (next.dayIndex === current.dayIndex && next.status === current.status) return;
      updateReplay(next);
      if (next.status === 'finished') {
        setAnnouncement('Simulation complete. Your result is shown in a dialog.');
        setResultOpen(true);
      }
    };
    const timer = window.setInterval(tick, 100);
    const deadline = window.setTimeout(
      tick,
      Math.ceil(Math.max(0, SIMULATION_DURATION_MS - (performance.now() - replayStartedAt.current))),
    );
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(deadline);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [replay.status, timeline, updateReplay]);

  const phase: SandboxPhase =
    run.status === 'submitting'
      ? 'submitting'
      : run.status === 'ready'
        ? replay.status === 'finished'
          ? 'finished'
          : 'playing'
        : 'planning';
  const locked = phase !== 'planning';
  const dayIndex = replay.dayIndex;

  const instruments = useMemo(() => (catalogue.status === 'ready' ? catalogue.data : []), [catalogue]);
  const filteredInstruments = useMemo(
    () =>
      instruments.filter(
        (instrument) =>
          instrument.name.toLocaleLowerCase().includes(filters.search.trim().toLocaleLowerCase()) &&
          (filters.assetClass === 'ALL' || instrument.assetClass === filters.assetClass) &&
          (filters.risk === 'ALL' || instrument.riskLevel === filters.risk),
      ),
    [instruments, filters],
  );

  // The plan in euros, in the scenario's order: what a run submits, and what the coach sees.
  // Holdings stay at planning prices while a run replays, so after a run this is the plan that was run.
  const planAllocations = useMemo<ScenarioAllocation[]>(
    () =>
      scenario.instruments.flatMap(({ id }) => {
        const cents = portfolio.holdings[id] ? positionValueCents(portfolio.holdings[id], PLANNING_PRICE) : 0;
        return cents ? [{ instrumentId: id, amount: cents / 100 }] : [];
      }),
    [scenario.instruments, portfolio.holdings],
  );

  usePublishCoachFocus({
    scopeId: `scenario-${scenario.id}`,
    label: `${phase === 'finished' ? 'Result' : phase === 'planning' ? 'Planning' : 'Running'} · ${scenario.code} ${scenario.title}`,
    scenarioId: scenario.id,
    allocations: planAllocations,
    scenarioRun: phase === 'finished',
    scenarioStars: phase === 'finished' && run.status === 'ready' ? run.data.stars.stars : undefined,
  });
  const askCoach = useAskCoach();
  function askForFeedback() {
    setResultOpen(false);
    setHandoffOpen(false);
    askCoach(FEEDBACK_REQUEST);
  }

  const plannedCents: Record<number, number> = Object.fromEntries(
    Object.entries(portfolio.holdings).map(([id, holding]) => [
      Number(id),
      positionValueCents(holding, PLANNING_PRICE),
    ]),
  );
  const positions = instruments
    .filter((instrument) => portfolio.holdings[instrument.id])
    .map((instrument) => ({
      instrument,
      valueCents: timeline
        ? (timeline.instrumentCents.get(instrument.id)?.[dayIndex] ?? 0)
        : plannedCents[instrument.id],
    }));
  const allocations = Object.fromEntries(positions.map((position) => [position.instrument.id, position.valueCents]));
  const hasHoldings = positions.length > 0;
  const cashCents = timeline ? timeline.cashCents[dayIndex] : portfolio.cashCents;
  const totalCents = timeline
    ? timeline.valueCents[dayIndex]
    : portfolio.cashCents + positions.reduce((total, position) => total + position.valueCents, 0);
  const paidOutCents = timeline ? timeline.paidOutCents[dayIndex] : 0;
  const visibleDates = useMemo(() => (timeline ? timeline.dates.slice(0, dayIndex + 1) : []), [timeline, dayIndex]);
  const equity = useMemo(() => (timeline ? timeline.valueCents.slice(0, dayIndex + 1) : []), [timeline, dayIndex]);
  const ruleChecks = checkRules(scenario.rules, plannedCents, budgetCents);
  const revealedNeeds = new Map<number, ScenarioMoneyNeedRun>();
  if (run.status === 'ready') {
    scenario.moneyNeeds.forEach((need, index) => {
      const outcome = run.data.moneyNeeds.find((item) => item.day === need.day && item.label === need.label);
      if (outcome && outcome.pointIndex <= dayIndex) revealedNeeds.set(index, outcome);
    });
  }

  const selectedInstrument = instruments.find((instrument) => instrument.id === selectedId) ?? null;
  const draftCents = parseAmountInput(draftText);
  const tradePlan =
    selectedId === null || locked
      ? null
      : planPosition(portfolio, { instrumentId: selectedId, targetCents: draftCents ?? NaN, price: PLANNING_PRICE });
  const draftError =
    tradePlan && !tradePlan.ok
      ? tradePlan.reason === 'exceeds-cash'
        ? `Not enough cash. You can allocate up to ${formatMoney(maxPositionCents(portfolio, selectedId!, PLANNING_PRICE))}.`
        : 'Enter a valid non-negative amount in EUR.'
      : undefined;

  const openInstrument = useCallback(
    (id: number, trigger: HTMLElement) => {
      returnFocusRef.current = trigger;
      setDraftText((positionValueCents(portfolio.holdings[id], PLANNING_PRICE) / 100).toFixed(2));
      setHistoryRange('1Y');
      setSelectedId(id);
      setChartView(timeline?.instrumentCents.has(id) ? 'simulation' : 'history');
      loadHistory(id);
    },
    [portfolio.holdings, timeline, loadHistory],
  );

  function submitPosition() {
    if (locked || !selectedInstrument || draftCents === null || draftCents <= 0) return;
    const plan = planPosition(portfolio, {
      instrumentId: selectedInstrument.id,
      targetCents: draftCents,
      price: PLANNING_PRICE,
    });
    if (!plan.ok || plan.kind === 'none' || plan.kind === 'remove') return;
    dispatch({
      type: 'setPosition',
      instrumentId: selectedInstrument.id,
      targetCents: draftCents,
      price: PLANNING_PRICE,
      dayIndex: 0,
    });
    setAnnouncement(
      `${selectedInstrument.name} set to ${formatMoney(draftCents)}. Cash left ${formatMoney(portfolio.cashCents - plan.deltaCents)}.`,
    );
    setSelectedId(null);
  }

  function removePosition(id: number) {
    if (locked || !portfolio.holdings[id]) return;
    const value = positionValueCents(portfolio.holdings[id], PLANNING_PRICE);
    dispatch({ type: 'setPosition', instrumentId: id, targetCents: 0, price: PLANNING_PRICE, dayIndex: 0 });
    const name = instruments.find((instrument) => instrument.id === id)?.name ?? 'Position';
    setAnnouncement(`${name} removed. Cash left ${formatMoney(portfolio.cashCents + value)}.`);
    if (selectedId === id) setSelectedId(null);
    else portfolioTitleRef.current?.focus({ preventScroll: true });
  }

  function runSimulation() {
    if (phase !== 'planning' || selectedId !== null || catalogue.status !== 'ready') return;
    const request = { allocations: planAllocations };
    runRequest.current?.abort();
    const controller = new AbortController();
    runRequest.current = controller;
    setRun({ status: 'submitting' });
    setAnnouncement('Running your plan in the scenario’s market…');
    runScenario(scenario.id, request, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        const runTimeline = buildRunTimeline(data);
        replayStartedAt.current = performance.now();
        updateReplay({ status: 'playing', dayIndex: 0 });
        setRun({ status: 'ready', data, timeline: runTimeline });
        setAnnouncement(
          `Simulation started. The full horizon plays in ${SIMULATION_DURATION_MS / 1000} seconds and your plan is locked.`,
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setRun({
          status: 'error',
          message: error instanceof Error ? error.message : 'The simulation could not be run.',
        });
        setAnnouncement('The simulation could not be run. Your plan is kept.');
      });
  }

  function changePlan() {
    if (run.status !== 'ready' || replayRef.current.status !== 'finished') return;
    setPreviousStars(run.data.stars.stars);
    setResultOpen(false);
    setHandoffOpen(false);
    setRun({ status: 'idle' });
    updateReplay(createReplay());
    setSelectedId(null);
    setChartView('history');
    setAnnouncement('Your plan is unlocked. Change it and run it again on the same market.');
    pageTitleRef.current?.focus({ preventScroll: true });
  }

  const unavailableReason =
    catalogue.status === 'loading'
      ? 'Loading the scenario’s instruments…'
      : catalogue.status === 'error'
        ? 'Load the instruments to build your plan.'
        : undefined;
  return (
    <>
      <WorkspaceLayout
        header={
          <SandboxHeader
            scenario={scenario}
            totalCents={totalCents}
            cashCents={cashCents}
            investedCents={totalCents - cashCents}
            budgetCents={budgetCents}
            paidOutCents={paidOutCents}
            actions={
              <SandboxActions
                scenarioId={scenario.id}
                phase={phase}
                canRun={catalogue.status === 'ready' && selectedId === null}
                hasHoldings={hasHoldings}
                failed={run.status === 'error'}
                unavailableReason={unavailableReason}
                onRun={runSimulation}
                onChangePlan={changePlan}
                onShowResult={() => setResultOpen(true)}
              />
            }
            titleRef={pageTitleRef}
          />
        }
        notice={
          <div className="flex flex-col gap-5">
            {phase === 'finished' && run.status === 'ready' && (
              <SandboxResult
                run={run.data}
                titleRef={resultTitleRef}
                onOpenDetails={() => setResultOpen(true)}
                onAskCoach={askForFeedback}
                onApply={() => { setResultOpen(false); setHandoffOpen(true); }}
              />
            )}
            {run.status === 'error' && (
              <Alert>
                <AlertTitle>Couldn’t run the simulation</AlertTitle>
                <AlertDescription className="[overflow-wrap:anywhere]">
                  {run.message} Your plan is kept. Use Try again below.
                </AlertDescription>
              </Alert>
            )}
            <SandboxBrief scenario={scenario} ruleChecks={ruleChecks} revealedNeeds={revealedNeeds} />
            <AllocationBar positions={positions} cashCents={cashCents} totalCents={totalCents} />
            {timeline && <ValueChart label="Portfolio value · simulated so far" dates={visibleDates} values={equity} />}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer py-1 focus-visible:outline-ring">How this scenario’s market works</summary>
              <div className="mt-2 flex flex-col gap-2 leading-relaxed">
                <p>
                  Every learner and every retry gets the same simulated market, so you can compare plans fairly.
                  Instruments move independently, with no correlation, which can exaggerate diversification. Cash
                  earns nothing. Money needed along the way is paid from cash first, then by selling the same share
                  of every holding. There are no fees, taxes or inflation.
                </p>
                {scenario.notSimulated.length > 0 && <p>Also not simulated: {scenario.notSimulated.join(' ')}</p>}
              </div>
            </details>
          </div>
        }
        instruments={
          <InstrumentList
            catalogue={catalogue}
            instruments={filteredInstruments}
            filters={filters}
            histories={histories}
            allocations={allocations}
            readOnly={locked}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters(DEFAULT_FILTERS)}
            onRetry={() => {
              setCatalogue({ status: 'loading' });
              setReloadKey((key) => key + 1);
            }}
            onRequestHistory={loadHistory}
            onRetryHistory={retryHistory}
            onOpen={openInstrument}
          />
        }
        portfolio={
          <PortfolioList
            positions={positions}
            cashCents={cashCents}
            totalCents={totalCents}
            readOnly={locked}
            titleRef={portfolioTitleRef}
            onOpen={openInstrument}
            onRemove={removePosition}
          />
        }
      />
      <InstrumentPanel
        instrument={selectedInstrument}
        owned={selectedId !== null && Object.hasOwn(portfolio.holdings, selectedId)}
        history={selectedId === null ? undefined : histories[selectedId]}
        range={historyRange}
        text={draftText}
        cents={draftCents}
        currentCents={selectedId === null ? 0 : (allocations[selectedId] ?? 0)}
        cashCents={cashCents}
        basisCents={budgetCents}
        maxCents={selectedId === null ? 0 : maxPositionCents(portfolio, selectedId, PLANNING_PRICE)}
        error={draftError}
        plan={tradePlan}
        returnFocusRef={returnFocusRef}
        onRangeChange={setHistoryRange}
        onTextChange={setDraftText}
        onClose={() => setSelectedId(null)}
        onSubmit={submitPosition}
        onRemove={() => {
          if (selectedId !== null) removePosition(selectedId);
        }}
        onRetryHistory={retryHistory}
        readOnly={locked}
        readOnlyMessage={
          phase === 'finished'
            ? 'This run is complete. Use Change plan to adjust the allocation and run it again.'
            : 'Your plan is locked while the simulation runs.'
        }
        chartView={chartView}
        onChartViewChange={setChartView}
        simulationChart={
          selectedId !== null && timeline?.instrumentCents.has(selectedId) ? (
            <ValueChart
              label="Your position in this scenario · revealed so far"
              dates={visibleDates}
              values={timeline.instrumentCents.get(selectedId)!.slice(0, dayIndex + 1)}
            />
          ) : undefined
        }
      />
      {run.status === 'ready' && (
        <SandboxResultDialog
          open={resultOpen && phase === 'finished'}
          scenario={scenario}
          run={run.data}
          previousStars={previousStars}
          finalFocus={resultTitleRef}
          onOpenChange={setResultOpen}
          onChangePlan={changePlan}
          onAskCoach={askForFeedback}
          onApply={() => { setResultOpen(false); setHandoffOpen(true); }}
        />
      )}
      {phase === 'finished' && run.status === 'ready' && (
        <Dialog open={handoffOpen} onOpenChange={setHandoffOpen}>
          <DialogContent finalFocus={resultTitleRef} className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>Your next real-world step</DialogTitle><DialogDescription>The result and Change plan remain available while you save a step here. Opening a tool will ask you to confirm leaving this run.</DialogDescription></DialogHeader>
            <JourneyHandoffCard source={{ kind: 'scenario', slug: scenario.slug }} sandbox />
            <DialogFooter><Button type="button" variant="outline" onClick={() => setHandoffOpen(false)}>Back to result</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
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
    <div className="flex justify-center px-4 py-10">
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
    <MessageCard title="Scenario not found" description="This scenario doesn't exist, or it has been removed.">
      <Link to="/scenarios" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        Browse scenarios
      </Link>
    </MessageCard>
  );
}
