import { useReducer } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceLayout } from '@/workspace/WorkspaceLayout';
import { formatMoney } from '@/workspace/portfolio/money';
import {
  createPortfolio,
  investedValueCents,
  portfolioReducer,
  totalValueCents,
  UNIT_PRICES,
} from '@/workspace/portfolio/portfolioReducer';
import { STARTING_BUDGET_CENTS } from './config';

/**
 * The Playground. This page owns all of its state (in memory only, like the demo), so leaving it
 * or refreshing starts over. Shared parts under `workspace/` receive everything as props.
 *
 * Temporary: the instrument list, replay controls and the full header arrive in the next steps.
 */
export function PlaygroundPage() {
  const [portfolio] = useReducer(portfolioReducer, STARTING_BUDGET_CENTS, createPortfolio);

  const totalCents = totalValueCents(portfolio, UNIT_PRICES);
  const investedCents = investedValueCents(portfolio, UNIT_PRICES);

  return (
    <WorkspaceLayout
      header={
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-lg font-semibold tracking-tight">Playground</h1>
            <Badge variant="outline" className="w-fit border border-border px-2 py-0.5">
              Simulated market · not real data
            </Badge>
          </div>
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Total value</dt>
              <dd className="font-heading text-lg font-semibold tabular-nums">{formatMoney(totalCents)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Cash</dt>
              <dd className="font-heading text-lg font-semibold tabular-nums">
                {formatMoney(portfolio.cashCents)}
              </dd>
            </div>
          </dl>
        </div>
      }
      instruments={
        <Card size="sm" className="border border-dashed border-border">
          <CardHeader>
            <CardTitle>Instruments</CardTitle>
            <CardDescription>The instrument list is coming soon.</CardDescription>
          </CardHeader>
        </Card>
      }
      portfolio={
        <Card size="sm" className="border border-border">
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>
              {Object.keys(portfolio.holdings).length === 0
                ? 'No positions yet.'
                : `${Object.keys(portfolio.holdings).length} positions`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm tabular-nums">
            Invested {formatMoney(investedCents)} of {formatMoney(portfolio.budgetCents)}
          </CardContent>
        </Card>
      }
      actionBar={<p className="text-sm text-muted-foreground">Replay controls are coming soon.</p>}
    />
  );
}
