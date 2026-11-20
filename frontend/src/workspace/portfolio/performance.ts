import type { PortfolioState, PriceLookup } from './portfolioReducer';
import { positionValueCents } from './portfolioReducer';

/** Net contribution including realised proceeds and any units still held. Closed positions count. */
export function instrumentContributions(
  state: PortfolioState,
  priceOf: PriceLookup,
): Map<number, number> {
  const contributions = new Map<number, number>();
  for (const trade of state.trades) {
    contributions.set(
      trade.instrumentId,
      (contributions.get(trade.instrumentId) ?? 0) + trade.cashDeltaCents,
    );
  }
  for (const [id, holding] of Object.entries(state.holdings)) {
    const instrumentId = Number(id);
    contributions.set(
      instrumentId,
      (contributions.get(instrumentId) ?? 0) + positionValueCents(holding, priceOf(instrumentId)),
    );
  }
  return contributions;
}
