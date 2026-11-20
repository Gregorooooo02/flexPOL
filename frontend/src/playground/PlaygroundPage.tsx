import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getInstrumentHistory, getInstruments } from '@/api';
import { ApiError } from '@/config/axios';
import type { HistoricalObservation, Instrument } from '@/model';
import { WorkspaceLayout } from '@/workspace/WorkspaceLayout';
import { AllocationBar } from '@/workspace/components/AllocationBar';
import { ChoiceField } from '@/workspace/components/ChoiceField';
import { InstrumentList } from '@/workspace/components/InstrumentList';
import { InstrumentPanel } from '@/workspace/components/InstrumentPanel';
import { PortfolioList } from '@/workspace/components/PortfolioList';
import { prepareHistory } from '@/workspace/history';
import type { HistoryRange } from '@/workspace/history';
import type { InstrumentFilters, LoadState } from '@/workspace/instruments';
import { formatMoney, parseAmountInput } from '@/workspace/portfolio/money';
import {
  createPortfolio,
  investedValueCents,
  maxPositionCents,
  planPosition,
  portfolioReducer,
  positionValueCents,
  totalValueCents,
  UNIT_PRICES,
} from '@/workspace/portfolio/portfolioReducer';
import { DEFAULT_HORIZON_YEARS, HORIZONS, STARTING_BUDGET_CENTS } from './config';
import { PlaygroundHeader } from './PlaygroundHeader';

const DEFAULT_FILTERS: InstrumentFilters = { search: '', assetClass: 'ALL', risk: 'ALL' };

/**
 * The Playground. This page owns all of its state (in memory only, like the demo), so leaving it
 * or refreshing starts over. Shared parts under `workspace/` receive everything as props.
 *
 * M3 builds allocations at day 0. Market generation, replay and changing prices arrive in M4.
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
  const historyRequests = useRef(new Map<number, AbortController>());
  const requestedHistoryIds = useRef(new Set<number>());
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const portfolioTitleRef = useRef<HTMLHeadingElement | null>(null);

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
      valueCents: positionValueCents(portfolio.holdings[instrument.id], 1),
    }));
  const allocations = Object.fromEntries(
    positions.map((position) => [position.instrument.id, position.valueCents]),
  );
  const selectedInstrument = instruments.find((instrument) => instrument.id === selectedId) ?? null;
  const draftCents = parseAmountInput(draftText);
  const tradePlan =
    selectedId === null
      ? null
      : planPosition(portfolio, {
          instrumentId: selectedId,
          targetCents: draftCents ?? NaN,
          price: 1,
        });
  const error =
    tradePlan && !tradePlan.ok
      ? tradePlan.reason === 'exceeds-cash'
        ? `Not enough cash. You can allocate up to ${formatMoney(maxPositionCents(portfolio, selectedId!, 1))}.`
        : 'Enter a valid non-negative amount in EUR.'
      : undefined;

  function openInstrument(id: number, trigger: HTMLElement) {
    returnFocusRef.current = trigger;
    setDraftText((positionValueCents(portfolio.holdings[id], 1) / 100).toFixed(2));
    setHistoryRange('1Y');
    setSelectedId(id);
    setAnnouncement('');
    loadHistory(id);
  }

  function submitPosition() {
    if (!selectedInstrument || draftCents === null || !tradePlan?.ok || tradePlan.kind === 'none')
      return;
    dispatch({
      type: 'setPosition',
      instrumentId: selectedInstrument.id,
      targetCents: draftCents,
      price: 1,
      dayIndex: 0,
    });
    setAnnouncement(
      `${selectedInstrument.name} allocation updated to ${formatMoney(draftCents)}. Available cash ${formatMoney(portfolio.cashCents - tradePlan.deltaCents)}.`,
    );
    setSelectedId(null);
  }

  function removePosition(id: number) {
    const instrument = instruments.find((item) => item.id === id);
    const value = positionValueCents(portfolio.holdings[id], 1);
    dispatch({ type: 'setPosition', instrumentId: id, targetCents: 0, price: 1, dayIndex: 0 });
    setAnnouncement(
      `${instrument?.name ?? 'Position'} removed. Available cash ${formatMoney(portfolio.cashCents + value)}.`,
    );
    portfolioTitleRef.current?.focus({ preventScroll: true });
  }

  const totalCents = totalValueCents(portfolio, UNIT_PRICES);
  const investedCents = investedValueCents(portfolio, UNIT_PRICES);

  return (
    <>
      <WorkspaceLayout
        header={
          <PlaygroundHeader
            totalCents={totalCents}
            cashCents={portfolio.cashCents}
            investedCents={investedCents}
          />
        }
        notice={
          <AllocationBar
            positions={positions}
            cashCents={portfolio.cashCents}
            totalCents={totalCents}
          />
        }
        instruments={
          <InstrumentList
            catalogue={catalogue}
            instruments={filteredInstruments}
            filters={filters}
            histories={histories}
            allocations={allocations}
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
            cashCents={portfolio.cashCents}
            totalCents={totalCents}
            titleRef={portfolioTitleRef}
            onOpen={openInstrument}
            onRemove={removePosition}
          />
        }
        actionBar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-36">
              <ChoiceField
                label="Simulation horizon"
                value={String(horizonYears)}
                options={HORIZONS.map((horizon) => ({
                  value: String(horizon.years),
                  label: `${horizon.years} ${horizon.years === 1 ? 'year' : 'years'}`,
                }))}
                onChange={(value) => setHorizonYears(Number(value))}
              />
            </div>
            <p className="max-w-sm text-xs text-muted-foreground">
              Build your allocation now. Replay controls arrive next; changing the horizon keeps
              your positions.
            </p>
          </div>
        }
      />
      <InstrumentPanel
        instrument={selectedInstrument}
        history={selectedId === null ? undefined : histories[selectedId]}
        range={historyRange}
        text={draftText}
        cents={draftCents}
        currentCents={
          selectedId === null ? 0 : positionValueCents(portfolio.holdings[selectedId], 1)
        }
        cashCents={portfolio.cashCents}
        basisCents={totalCents}
        maxCents={selectedId === null ? 0 : maxPositionCents(portfolio, selectedId, 1)}
        error={error}
        plan={tradePlan}
        returnFocusRef={returnFocusRef}
        onRangeChange={setHistoryRange}
        onTextChange={setDraftText}
        onClose={() => setSelectedId(null)}
        onSubmit={submitPosition}
        onRetryHistory={retryHistory}
      />
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
