import type { Cents } from '@/workspace/portfolio/money';
import type { Trade } from '@/workspace/portfolio/portfolioReducer';
import { lastDayIndex, tapePrice } from './marketTape';
import type { MarketTape } from './marketTape';

/**
 * Total portfolio value per replay day, from day 0 to `upToIndex`, rebuilt from the trade log.
 * Holdings only change on trade days, so days skipped by a fast replay are filled in correctly.
 */
export function buildEquityCurve(
  tape: MarketTape,
  trades: readonly Trade[],
  startCashCents: Cents,
  upToIndex: number,
): Cents[] {
  const lastDay = Math.min(Math.max(Math.floor(upToIndex), 0), lastDayIndex(tape));
  const units = new Map<number, number>();
  let cash = startCashCents;
  let nextTrade = 0;
  const curve: Cents[] = [];

  for (let day = 0; day <= lastDay; day++) {
    while (nextTrade < trades.length && trades[nextTrade].dayIndex <= day) {
      const trade = trades[nextTrade];
      cash += trade.cashDeltaCents;
      if (trade.unitsAfter === 0) {
        units.delete(trade.instrumentId);
      } else {
        units.set(trade.instrumentId, trade.unitsAfter);
      }
      nextTrade += 1;
    }
    let invested = 0;
    for (const [instrumentId, held] of units) {
      invested += Math.round(held * tapePrice(tape, instrumentId, day));
    }
    curve.push(cash + invested);
  }
  return curve;
}
