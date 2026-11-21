import type { ScenarioRunResponse } from '@/model';
import type { Cents } from '@/workspace/portfolio/money';

/** A scenario run in integer cents, indexed by replay step. Built once when the run arrives. */
export interface RunTimeline {
  readonly dates: readonly string[];
  /** Cash plus holdings, after the money needs paid so far. */
  readonly valueCents: readonly Cents[];
  readonly cashCents: readonly Cents[];
  /** Money paid out for needs up to and including each step. */
  readonly paidOutCents: readonly Cents[];
  readonly instrumentCents: ReadonlyMap<number, readonly Cents[]>;
  readonly lastIndex: number;
}

const toCents = (amount: number): Cents => Math.round(amount * 100);

/** Throws if the run's series don't line up, so the page shows a retryable error instead of wrong numbers. */
export function buildRunTimeline(run: ScenarioRunResponse): RunTimeline {
  if (!Array.isArray(run.points) || run.points.length < 2) {
    throw new Error('The simulation returned no data.');
  }
  const count = run.points.length;
  const instrumentCents = new Map<number, readonly Cents[]>();
  for (const instrument of run.instruments) {
    if (!Array.isArray(instrument.values) || instrument.values.length !== count) {
      throw new Error(`Instrument ${instrument.instrumentId} has a different number of days.`);
    }
    instrumentCents.set(instrument.instrumentId, instrument.values.map(toCents));
  }

  const paidOutCents: Cents[] = new Array<Cents>(count).fill(0);
  for (const need of run.moneyNeeds) {
    if (!Number.isInteger(need.pointIndex) || need.pointIndex < 0 || need.pointIndex >= count) {
      throw new Error('The simulation returned an invalid payment date.');
    }
    const paid = toCents(need.paidFromCash) + toCents(need.paidFromHoldings);
    for (let index = need.pointIndex; index < count; index++) paidOutCents[index] += paid;
  }

  return {
    dates: run.points.map((point) => point.date),
    valueCents: run.points.map((point) => toCents(point.value)),
    cashCents: run.points.map((point) => toCents(point.cash)),
    paidOutCents,
    instrumentCents,
    lastIndex: count - 1,
  };
}
