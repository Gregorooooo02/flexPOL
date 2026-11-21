import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getInstrumentHistory, getInstruments, simulateBatch } from '@/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiError } from '@/config/axios';
import type { HistoricalObservation, Instrument } from '@/model';
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
  investedValueCents,
  holdingProfitCents,
  maxPositionCents,
  planPosition,
  portfolioReducer,
  positionValueCents,
  totalValueCents,
  UNIT_PRICES,
} from '@/workspace/portfolio/portfolioReducer';
import { instrumentContributions } from '@/workspace/portfolio/performance';
import {
  DEFAULT_HORIZON_YEARS,
  HORIZONS,
  SIMULATION_DURATION_MS,
  STARTING_BUDGET_CENTS,
  TAPE_BASE_VALUE,
} from './config';
import { PlaygroundHeader } from './PlaygroundHeader';
import { PlaygroundActions } from './PlaygroundActions';
import { ReplaySummary } from './ReplaySummary';
import { buildMarketTape, lastDayIndex, tapePrice } from './marketTape';
import type { MarketTape } from './marketTape';
import { buildEquityCurve } from './equityCurve';
import { advanceReplay, createReplay } from './replay';
import type { ReplayState } from './replay';

const DEFAULT_FILTERS: InstrumentFilters = { search: '', assetClass: 'ALL', risk: 'ALL' };
const FINISHED_MESSAGE =
  'Simulation complete. Positions are now read-only. Use Start over for a fresh market.';

/**
 * The Playground. This page owns all of its state (in memory only, like the demo), so leaving it
 * or refreshing starts over. Shared parts under `workspace/` receive everything as props.
 *
 * Market paths, the replay clock and trade state all live here, not in a provider or store.
 */
export function PlaygroundPage() {
  const [portfolio, dispatch] = useReducer(
    portfolioReducer,
    STARTING_BUDGET_CENTS,
    createPortfolio,
  );
  const [catalogue, setCatalogue] = useState<LoadState<Instrument[]>>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState<InstrumentFilters>(DEFAULT_FILTERS);
  const [histories, setHistories] = useState<Record<number, LoadState<HistoricalObservation[]>>>(
    {},
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('0.00');
  const [historyRange, setHistoryRange] = useState<HistoryRange>('1Y');
  const [horizonYears, setHorizonYears] = useState(DEFAULT_HORIZON_YEARS);
  const [announcement, setAnnouncement] = useState('');
  const [marketState, setMarket] = useState<LoadState<MarketTape>>({ status: 'loading' });
  const [marketKey, setMarketKey] = useState(0);
  const [replay, setReplay] = useState(createReplay);
  const [chartView, setChartView] = useState<'history' | 'simulation'>('history');
  // Mirror the current point so a trade always checks the real deadline, even between UI ticks.
  const replayRef = useRef(replay);
  const clockRef = useRef<{
    timer: number | null;
    deadlineTimer: number | null;
    startedAt: number;
  } | null>(null);
  const marketRequest = useRef<AbortController | null>(null);
  const historyRequests = useRef(new Map<number, AbortController>());
  const requestedHistoryIds = useRef(new Set<number>());
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const portfolioTitleRef = useRef<HTMLHeadingElement | null>(null);
  const pageTitleRef = useRef<HTMLHeadingElement | null>(null);

  const updateReplay = useCallback((next: ReplayState) => {
    replayRef.current = next;
    setReplay(next);
  }, []);

  const stopClock = useCallback(() => {
    const clock = clockRef.current;
    if (clock?.timer != null) window.clearInterval(clock.timer);
    if (clock?.deadlineTimer != null) window.clearTimeout(clock.deadlineTimer);
    clockRef.current = null;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getInstruments(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setCatalogue({
            status: 'ready',
            data: [...data].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id),
          });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setCatalogue({
            status: 'error',
            message:
              error instanceof ApiError
                ? error.message
                : 'Something went wrong while loading instruments.',
          });
      });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const requests = historyRequests.current;
    const requestedIds = requestedHistoryIds.current;
    return () => {
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
          setHistories((previous) => ({
            ...previous,
            [id]: { status: 'ready', data: prepareHistory(data) },
          }));
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
  const instruments = useMemo(
    () => (catalogue.status === 'ready' ? catalogue.data : []),
    [catalogue],
  );
  const availableInstruments = useMemo(
    () =>
      instruments.filter(
        (instrument) =>
          instrument.currency === 'EUR' && instrument.simulationConfiguration !== null,
      ),
    [instruments],
  );
  const market = marketState;
  const marketUnavailableReason =
    catalogue.status === 'loading'
      ? 'Loading instruments…'
      : catalogue.status === 'error'
        ? 'Load the instrument catalogue to prepare a simulation.'
        : availableInstruments.length === 0
          ? 'No EUR instruments are available for this simulation.'
          : undefined;

  useEffect(() => {
    if (availableInstruments.length === 0) return;
    const horizon = HORIZONS.find((item) => item.years === horizonYears)!;
    const controller = new AbortController();
    marketRequest.current = controller;
    simulateBatch(
      availableInstruments.map((instrument) => ({
        instrumentId: instrument.id,
        initialInvestment: TAPE_BASE_VALUE,
        durationDays: horizon.days,
      })),
      controller.signal,
    )
      .then((results) => {
        if (controller.signal.aborted) return;
        const data = buildMarketTape(results, TAPE_BASE_VALUE, {
          instrumentIds: availableInstruments.map((instrument) => instrument.id),
          currency: 'EUR',
          durationDays: horizon.days,
        });
        setMarket({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setMarket({
            status: 'error',
            message:
              error instanceof Error ? error.message : 'The simulated market could not be loaded.',
          });
      });
    return () => controller.abort();
  }, [availableInstruments, catalogue.status, horizonYears, marketKey]);

  const tape = market.status === 'ready' ? market.data : null;

  const synchroniseReplay = useCallback(() => {
    const current = replayRef.current;
    const clock = clockRef.current;
    if (current.status !== 'playing' || !clock || !tape) return current;
    const next = advanceReplay(current, performance.now() - clock.startedAt, lastDayIndex(tape));
    if (next.dayIndex !== current.dayIndex || next.status !== current.status) {
      updateReplay(next);
      if (next.status === 'finished') {
        stopClock();
        setAnnouncement(FINISHED_MESSAGE);
      }
    }
    return next;
  }, [tape, updateReplay, stopClock]);

  useEffect(() => {
    const clock = clockRef.current;
    if (replay.status !== 'playing' || !clock) return;
    let active = true;
    const tick = () => {
      if (active && clockRef.current === clock) synchroniseReplay();
    };
    clock.timer = window.setInterval(tick, 100);
    clock.deadlineTimer = window.setTimeout(
      tick,
      Math.ceil(Math.max(0, SIMULATION_DURATION_MS - (performance.now() - clock.startedAt))),
    );
    // Hidden tabs keep the same deadline. Catch up immediately if the browser throttled timers.
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      active = false;
      if (clock.timer != null) window.clearInterval(clock.timer);
      if (clock.deadlineTimer != null) window.clearTimeout(clock.deadlineTimer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [replay.status, synchroniseReplay]);

  const priceOf = useCallback(
    (id: number) => {
      if (tape) return tapePrice(tape, id, replay.dayIndex);
      if (replay.status !== 'idle') throw new Error('The active simulated market is unavailable.');
      return UNIT_PRICES(id);
    },
    [tape, replay.dayIndex, replay.status],
  );

  const equity = useMemo(
    () =>
      tape ? buildEquityCurve(tape, portfolio.trades, portfolio.budgetCents, replay.dayIndex) : [],
    [tape, portfolio.trades, portfolio.budgetCents, replay.dayIndex],
  );
  const visibleDates = useMemo(
    () => (tape ? tape.dates.slice(0, replay.dayIndex + 1) : []),
    [tape, replay.dayIndex],
  );
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
  const positions = instruments
    .filter((instrument) => portfolio.holdings[instrument.id])
    .map((instrument) => ({
      instrument,
      valueCents: positionValueCents(portfolio.holdings[instrument.id], priceOf(instrument.id)),
      profitCents:
        replay.status === 'idle'
          ? undefined
          : holdingProfitCents(portfolio.holdings[instrument.id], priceOf(instrument.id)),
    }));
  const allocations = Object.fromEntries(
    positions.map((position) => [position.instrument.id, position.valueCents]),
  );
  const hasHoldings = Object.keys(portfolio.holdings).length > 0;
  const selectedInstrument = instruments.find((instrument) => instrument.id === selectedId) ?? null;
  const draftCents = parseAmountInput(draftText);
  const tradePlan =
    selectedId === null
      ? null
      : planPosition(portfolio, {
          instrumentId: selectedId,
          targetCents: draftCents ?? NaN,
          price: priceOf(selectedId),
        });
  const error =
    tradePlan && !tradePlan.ok
      ? tradePlan.reason === 'exceeds-cash'
        ? `Not enough cash. You can allocate up to ${formatMoney(maxPositionCents(portfolio, selectedId!, priceOf(selectedId!)))}.`
        : tradePlan.reason === 'invalid-price'
          ? 'This instrument has reached zero value. You can remove an existing position, but cannot buy at zero.'
          : 'Enter a valid non-negative amount in EUR.'
      : undefined;

  const openInstrument = useCallback(
    (id: number, trigger: HTMLElement) => {
      const snapshot = synchroniseReplay();
      const price = tape ? tapePrice(tape, id, snapshot.dayIndex) : 1;
      returnFocusRef.current = trigger;
      setDraftText((positionValueCents(portfolio.holdings[id], price) / 100).toFixed(2));
      setHistoryRange('1Y');
      setSelectedId(id);
      setChartView(snapshot.status === 'idle' ? 'history' : 'simulation');
      setAnnouncement(
        snapshot.status === 'playing'
          ? 'Simulation continues while you edit. Trades use the current simulated value.'
          : '',
      );
      loadHistory(id);
    },
    [synchroniseReplay, tape, portfolio.holdings, loadHistory],
  );

  function submitPosition() {
    const snapshot = synchroniseReplay();
    if (
      snapshot.status === 'finished' ||
      !selectedInstrument ||
      draftCents === null ||
      draftCents <= 0
    )
      return;
    const price = tape ? tapePrice(tape, selectedInstrument.id, snapshot.dayIndex) : 1;
    const plan = planPosition(portfolio, {
      instrumentId: selectedInstrument.id,
      targetCents: draftCents,
      price,
    });
    if (!plan.ok || plan.kind === 'none' || plan.kind === 'remove') return;
    dispatch({
      type: 'setPosition',
      instrumentId: selectedInstrument.id,
      targetCents: draftCents,
      price,
      dayIndex: snapshot.dayIndex,
    });
    setAnnouncement(
      `${selectedInstrument.name} allocation updated to ${formatMoney(draftCents)}. Available cash ${formatMoney(portfolio.cashCents - plan.deltaCents)}.`,
    );
    setSelectedId(null);
  }

  function removePosition(id: number) {
    const snapshot = synchroniseReplay();
    if (snapshot.status === 'finished' || !portfolio.holdings[id]) return;
    const instrument = instruments.find((item) => item.id === id);
    const price = tape ? tapePrice(tape, id, snapshot.dayIndex) : 1;
    const value = positionValueCents(portfolio.holdings[id], price);
    dispatch({
      type: 'setPosition',
      instrumentId: id,
      targetCents: 0,
      price,
      dayIndex: snapshot.dayIndex,
    });
    setAnnouncement(
      `${instrument?.name ?? 'Position'} removed. Available cash ${formatMoney(portfolio.cashCents + value)}.`,
    );
    if (selectedId === id) setSelectedId(null);
    else portfolioTitleRef.current?.focus({ preventScroll: true });
  }

  function play() {
    if (!tape || selectedId !== null || replayRef.current.status !== 'idle' || !hasHoldings) return;
    clockRef.current = { timer: null, deadlineTimer: null, startedAt: performance.now() };
    updateReplay({ ...replayRef.current, status: 'playing' });
    setAnnouncement(
      'Simulation started. The full horizon plays in 10 seconds and cannot be paused.',
    );
  }

  function changeHorizon(years: number) {
    if (
      replayRef.current.status !== 'idle' ||
      years === horizonYears ||
      !HORIZONS.some((horizon) => horizon.years === years)
    )
      return;
    marketRequest.current?.abort();
    setMarket({ status: 'loading' });
    setSelectedId(null);
    setHorizonYears(years);
  }

  function retryMarket() {
    if (replayRef.current.status !== 'idle' || availableInstruments.length === 0) return;
    marketRequest.current?.abort();
    setMarket({ status: 'loading' });
    setMarketKey((key) => key + 1);
  }

  function startOver() {
    if (replayRef.current.status !== 'finished') return;
    stopClock();
    marketRequest.current?.abort();
    updateReplay(createReplay());
    dispatch({ type: 'reset' });
    setMarket({ status: 'loading' });
    setMarketKey((key) => key + 1);
    setSelectedId(null);
    setDraftText('0.00');
    setHistoryRange('1Y');
    setChartView('history');
    setAnnouncement('Starting over with €10,000 cash and a fresh market.');
    pageTitleRef.current?.focus({ preventScroll: true });
  }

  const totalCents = totalValueCents(portfolio, priceOf);
  const investedCents = investedValueCents(portfolio, priceOf);
  const contributions = [...instrumentContributions(portfolio, priceOf)].map(([id, cents]) => ({
    id,
    cents,
    name: instruments.find((instrument) => instrument.id === id)?.name ?? `Instrument ${id}`,
  }));
  const best = contributions.filter((item) => item.cents > 0).sort((a, b) => b.cents - a.cents)[0];
  const worst = contributions.filter((item) => item.cents < 0).sort((a, b) => a.cents - b.cents)[0];
  const finished = replay.status === 'finished';

  return (
    <>
      <WorkspaceLayout
        header={
          <PlaygroundHeader
            totalCents={totalCents}
            cashCents={portfolio.cashCents}
            investedCents={investedCents}
            budgetCents={portfolio.budgetCents}
            actions={
              <PlaygroundActions
                market={market}
                replay={replay}
                horizonYears={horizonYears}
                blocked={selectedId !== null}
                needsAllocation={replay.status === 'idle' && !hasHoldings}
                unavailableReason={marketUnavailableReason}
                onHorizonChange={changeHorizon}
                onPlay={play}
                onRetry={retryMarket}
                onStartOver={startOver}
              />
            }
            titleRef={pageTitleRef}
          />
        }
        notice={
          <div className="flex flex-col gap-5">
            {market.status === 'error' && !marketUnavailableReason && (
              <Alert>
                <AlertTitle>Couldn’t prepare the market</AlertTitle>
                <AlertDescription className="[overflow-wrap:anywhere]">
                  {market.message} Your allocations are kept. Use Retry market in the header.
                </AlertDescription>
              </Alert>
            )}
            {finished && (
              <ReplaySummary
                finalCents={totalCents}
                budgetCents={portfolio.budgetCents}
                best={best}
                worst={worst}
              />
            )}
            <AllocationBar
              positions={positions}
              cashCents={portfolio.cashCents}
              totalCents={totalCents}
            />
            <ValueChart
              label="Portfolio value · simulated so far"
              dates={visibleDates}
              values={equity}
              loading={market.status === 'loading'}
              emptyMessage="Chart available when the market is ready."
            />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer py-1 focus-visible:outline-ring">
                How this simulated market works
              </summary>
              <p className="mt-2 leading-relaxed">
                Instruments move independently, with no correlation. This can exaggerate
                diversification benefits. Cash earns no interest. Trades fill at the current
                simulated value with no explicit taxes, trading fees, slippage or inflation. These
                synthetic outcomes are for learning, not investment advice.
              </p>
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
            readOnly={finished}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters(DEFAULT_FILTERS)}
            onRetry={() => {
              setCatalogue({ status: 'loading' });
              setMarket({ status: 'loading' });
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
            cashCents={portfolio.cashCents}
            totalCents={totalCents}
            readOnly={finished}
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
        currentCents={
          selectedId === null
            ? 0
            : positionValueCents(portfolio.holdings[selectedId], priceOf(selectedId))
        }
        cashCents={portfolio.cashCents}
        basisCents={totalCents}
        maxCents={
          selectedId === null ? 0 : maxPositionCents(portfolio, selectedId, priceOf(selectedId))
        }
        error={error}
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
        readOnly={finished}
        running={replay.status === 'playing'}
        chartView={chartView}
        onChartViewChange={setChartView}
        simulationChart={
          selectedId !== null && tape ? (
            <ValueChart
              label="Synthetic index · start = 100 · revealed so far"
              dates={visibleDates}
              values={tape.series
                .get(selectedId)!
                .slice(0, replay.dayIndex + 1)
                .map((value) => (value / TAPE_BASE_VALUE) * 100)}
              unit="INDEX"
            />
          ) : undefined
        }
      />
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
