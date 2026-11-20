/**
 * Portfolio state transitions. Pure functions: no React, no I/O.
 *
 * Money is integer cents. A position is stored as `units` of an instrument; its value is
 * `units × price`, rounded to cents. Before the replay starts every price is 1, so units equal cents.
 *
 * The user sets a *target position size*. The trade is the difference between the target and the
 * current value, and `planPosition` describes it so the UI can label it ("Buy", "Sell", "Remove").
 */

import type { Cents } from './money';

export interface Holding {
  units: number;
  /** What was paid for the units still held (average-cost basis), in cents. */
  costCents: Cents;
}

export interface Trade {
  dayIndex: number;
  instrumentId: number;
  /** Change in cash: negative for a buy, positive for a sell. */
  cashDeltaCents: Cents;
  /** The units held in this instrument right after the trade (0 when removed). */
  unitsAfter: number;
}

export interface PortfolioState {
  budgetCents: Cents;
  cashCents: Cents;
  holdings: Readonly<Record<number, Holding>>;
  trades: readonly Trade[];
}

export type PortfolioAction =
  | {
      type: 'setPosition';
      instrumentId: number;
      targetCents: Cents;
      price: number;
      dayIndex: number;
    }
  | { type: 'reset' };

/** Current price of an instrument, relative to its starting value. */
export type PriceLookup = (instrumentId: number) => number;

/** Prices before the replay starts: every instrument is at 1. */
export const UNIT_PRICES: PriceLookup = () => 1;

export type TradeKind = 'buy' | 'sell' | 'remove' | 'none';

export type TradePlan =
  | { ok: true; kind: TradeKind; deltaCents: Cents }
  | { ok: false; reason: 'invalid-amount' | 'invalid-price' | 'exceeds-cash' };

export function createPortfolio(budgetCents: Cents): PortfolioState {
  return { budgetCents, cashCents: budgetCents, holdings: {}, trades: [] };
}

export function positionValueCents(holding: Holding | undefined, price: number): Cents {
  return holding ? Math.round(holding.units * price) : 0;
}

/** Value minus what was paid, in cents. */
export function holdingProfitCents(holding: Holding, price: number): Cents {
  return positionValueCents(holding, price) - holding.costCents;
}

/** The value of everything held, excluding cash. */
export function investedValueCents(state: PortfolioState, priceOf: PriceLookup): Cents {
  let total = 0;
  for (const [id, holding] of Object.entries(state.holdings)) {
    total += positionValueCents(holding, priceOf(Number(id)));
  }
  return total;
}

/** Cash plus the value of everything held. Rows sum exactly to this total. */
export function totalValueCents(state: PortfolioState, priceOf: PriceLookup): Cents {
  return state.cashCents + investedValueCents(state, priceOf);
}

/** The largest target a position can be set to: what it is worth now plus the cash available. */
export function maxPositionCents(
  state: PortfolioState,
  instrumentId: number,
  price: number,
): Cents {
  return positionValueCents(state.holdings[instrumentId], price) + state.cashCents;
}

/** Describes what setting a position to `targetCents` would do, or why it cannot be done. */
export function planPosition(
  state: PortfolioState,
  input: { instrumentId: number; targetCents: Cents; price: number },
): TradePlan {
  const { instrumentId, targetCents, price } = input;
  // Rounded simulations can reach zero. Existing worthless positions can be cleared, not bought.
  if (!Number.isFinite(price) || price < 0 || (price === 0 && targetCents > 0)) {
    return { ok: false, reason: 'invalid-price' };
  }
  if (!Number.isSafeInteger(targetCents) || targetCents < 0) {
    return { ok: false, reason: 'invalid-amount' };
  }

  const holding = state.holdings[instrumentId];
  const deltaCents = targetCents - positionValueCents(holding, price);
  if (deltaCents > state.cashCents) {
    return { ok: false, reason: 'exceeds-cash' };
  }
  if (targetCents === 0) {
    return { ok: true, kind: holding ? 'remove' : 'none', deltaCents };
  }
  if (deltaCents === 0) {
    return { ok: true, kind: 'none', deltaCents };
  }
  return { ok: true, kind: deltaCents > 0 ? 'buy' : 'sell', deltaCents };
}

export function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'reset':
      return createPortfolio(state.budgetCents);

    case 'setPosition': {
      const { instrumentId, targetCents, price, dayIndex } = action;
      const plan = planPosition(state, { instrumentId, targetCents, price });
      if (!plan.ok || plan.kind === 'none') {
        return state;
      }

      const holding = state.holdings[instrumentId];
      const currentValue = positionValueCents(holding, price);
      const { [instrumentId]: _removed, ...otherHoldings } = state.holdings;

      let holdings: Readonly<Record<number, Holding>>;
      let unitsAfter: number;
      if (plan.kind === 'remove') {
        holdings = otherHoldings;
        unitsAfter = 0;
      } else {
        unitsAfter = targetCents / price;
        const costCents =
          plan.kind === 'buy'
            ? (holding?.costCents ?? 0) + plan.deltaCents
            : Math.round(((holding?.costCents ?? 0) * targetCents) / currentValue);
        holdings = { ...otherHoldings, [instrumentId]: { units: unitsAfter, costCents } };
      }

      return {
        budgetCents: state.budgetCents,
        cashCents: state.cashCents - plan.deltaCents,
        holdings,
        trades: [
          ...state.trades,
          { dayIndex, instrumentId, cashDeltaCents: -plan.deltaCents, unitsAfter },
        ],
      };
    }
  }
}
