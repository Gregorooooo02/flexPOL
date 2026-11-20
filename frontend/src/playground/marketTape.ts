import type { SimulationResult } from '@/model';

/**
 * The simulated future of every instrument on one shared timeline. Built on the client from the
 * results of `POST /api/simulations/batch`; it is not a backend type.
 */
export interface MarketTape {
  baseValue: number;
  startDate: string;
  endDate: string;
  /** One date per replay day (weekdays only), starting with the start date. */
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
export function buildMarketTape(results: readonly SimulationResult[], baseValue: number): MarketTape {
  const first = results[0];
  if (!first || first.points.length === 0) {
    throw new Error('The simulation returned no data.');
  }

  const dates = first.points.map((point) => point.date);
  const series = new Map<number, readonly number[]>();
  const seeds = new Map<number, number>();

  for (const result of results) {
    if (series.has(result.instrumentId)) {
      throw new Error(`Instrument ${result.instrumentId} appears twice in the simulation.`);
    }
    if (result.points.length !== dates.length) {
      throw new Error(`Instrument ${result.instrumentId} has a different number of days.`);
    }
    const values: number[] = [];
    result.points.forEach((point, index) => {
      if (point.date !== dates[index]) {
        throw new Error(`Instrument ${result.instrumentId} has different dates.`);
      }
      if (!Number.isFinite(point.investmentValue)) {
        throw new Error(`Instrument ${result.instrumentId} has an invalid value.`);
      }
      values.push(point.investmentValue);
    });
    if (Math.abs(values[0] - baseValue) > 0.005) {
      throw new Error(`Instrument ${result.instrumentId} does not start at the base value.`);
    }
    series.set(result.instrumentId, values);
    seeds.set(result.instrumentId, result.randomSeed);
  }

  return {
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
  const day = Math.min(Math.max(Math.floor(dayIndex), 0), values.length - 1);
  return values[day] / tape.baseValue;
}
