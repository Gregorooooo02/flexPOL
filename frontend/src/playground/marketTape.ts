import type { SimulationPoint, SimulationResult } from '@/model';

/**
 * The simulated future of every instrument on one shared timeline. Built on the client from the
 * results of `POST /api/simulations/batch`; it is not a backend type.
 */
export interface MarketTape {
  currency: string;
  baseValue: number;
  startDate: string;
  endDate: string;
  /** Initial point, weekday points, and possibly a terminal weekend carry-forward point. */
  dates: readonly string[];
  /** Simulated value per date for each instrument; every series starts at `baseValue`. */
  series: ReadonlyMap<number, readonly number[]>;
  /** The seed each instrument's path was generated with. */
  seeds: ReadonlyMap<number, number>;
}

/** Index of the last replay day. */
export function lastDayIndex(tape: MarketTape): number {
  return tape.dates.length - 1;
}

/**
 * Turns batch results into a tape. Throws if the results do not share one timeline or do not
 * start at the base value, so the page can show a load error instead of wrong numbers.
 */
export function buildMarketTape(
  results: readonly SimulationResult[],
  baseValue: number,
  expected?: { instrumentIds: readonly number[]; currency: string; durationDays: number },
): MarketTape {
  if (!Array.isArray(results)) throw new Error('The simulation returned an invalid response.');
  const batch: readonly SimulationResult[] = results;
  const first = batch[0];
  if (!first || !Array.isArray(first.points) || first.points.length < 2) {
    throw new Error('The simulation returned no data.');
  }
  if (!Number.isFinite(baseValue) || baseValue <= 0)
    throw new Error('The simulation base must be positive.');
  if (
    expected &&
    (results.length !== expected.instrumentIds.length ||
      new Set(expected.instrumentIds).size !== results.length)
  ) {
    throw new Error('The simulation did not return every requested instrument.');
  }

  const dates: string[] = first.points.map((point: SimulationPoint) => point.date);
  if (
    dates.some((date, index) => {
      const time = Date.parse(`${date}T00:00:00Z`);
      return (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(time) ||
        new Date(time).toISOString().slice(0, 10) !== date ||
        (index > 0 && date <= dates[index - 1])
      );
    })
  )
    throw new Error('The simulation returned invalid or unordered dates.');
  if (expected) {
    const end = new Date(`${dates[0]}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + expected.durationDays);
    if (end.toISOString().slice(0, 10) !== dates.at(-1))
      throw new Error('The simulation returned the wrong end date.');
  }
  const series = new Map<number, readonly number[]>();
  const seeds = new Map<number, number>();

  for (const result of batch) {
    if (
      expected &&
      (!expected.instrumentIds.includes(result.instrumentId) ||
        result.currency !== expected.currency ||
        result.durationDays !== expected.durationDays)
    ) {
      throw new Error(
        'The simulation does not match the requested instruments, currency or horizon.',
      );
    }
    if (
      result.currency !== first.currency ||
      result.initialInvestment !== baseValue ||
      result.startDate !== dates[0] ||
      result.endDate !== dates.at(-1)
    ) {
      throw new Error('The simulations must share one currency, base and timeline.');
    }
    if (series.has(result.instrumentId)) {
      throw new Error(`Instrument ${result.instrumentId} appears twice in the simulation.`);
    }
    if (!Array.isArray(result.points) || result.points.length !== dates.length) {
      throw new Error(`Instrument ${result.instrumentId} has a different number of days.`);
    }
    const values: number[] = [];
    result.points.forEach((point: SimulationPoint, index: number) => {
      if (point.date !== dates[index]) {
        throw new Error(`Instrument ${result.instrumentId} has different dates.`);
      }
      if (!Number.isFinite(point.investmentValue) || point.investmentValue < 0) {
        throw new Error(`Instrument ${result.instrumentId} has an invalid value.`);
      }
      values.push(point.investmentValue);
    });
    if (values[0] !== baseValue) {
      throw new Error(`Instrument ${result.instrumentId} does not start at the base value.`);
    }
    if (
      result.finalValue !== values.at(-1) ||
      !Number.isFinite(result.totalReturn) ||
      !Number.isSafeInteger(result.randomSeed)
    ) {
      throw new Error('The simulation returned inconsistent results.');
    }
    series.set(result.instrumentId, values);
    seeds.set(result.instrumentId, result.randomSeed);
  }

  return {
    currency: first.currency,
    baseValue,
    startDate: first.startDate,
    endDate: first.endDate,
    dates,
    series,
    seeds,
  };
}

/** The price of an instrument on a replay day, relative to its starting value (1 on day 0). */
export function tapePrice(tape: MarketTape, instrumentId: number, dayIndex: number): number {
  const values = tape.series.get(instrumentId);
  if (!values) {
    throw new Error(`There are no simulated prices for instrument ${instrumentId}.`);
  }
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex >= values.length) {
    throw new Error('The requested replay date is outside the simulated market.');
  }
  return values[dayIndex] / tape.baseValue;
}
