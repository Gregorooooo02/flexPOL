import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PortfolioComparison } from '@/model';

interface PortfolioPredictionProps {
  readonly comparison: PortfolioComparison;
  readonly revealedPrediction: string | undefined;
  readonly onReveal: (prediction: string) => void;
}

const coins = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

export function PortfolioPrediction({ comparison, revealedPrediction, onReveal }: PortfolioPredictionProps) {
  const [prediction, setPrediction] = useState<string>();
  const { company, startingBalance, dropPercent, portfolios } = comparison;
  const [first, second] = portfolios;
  const largerLoss = first.exposurePercent > second.exposurePercent ? first : second;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Each portfolio starts with {coins.format(startingBalance)} coins. {company} falls {dropPercent}%.
        {' '}All other holdings stay at the same price.
      </p>
      {revealedPrediction === undefined ? (
        <>
          <p className="text-sm font-semibold">Which portfolio loses more?</p>
          <ToggleGroup aria-label="Which portfolio loses more?" variant="outline"
            className="grid w-full grid-cols-1 items-stretch sm:grid-cols-2"
            value={prediction ? [prediction] : []} onValueChange={(values) => setPrediction(values[0])}>
            {portfolios.map((portfolio) => (
              <ToggleGroupItem key={portfolio.id} value={portfolio.id}
                className="h-auto min-h-16 w-full flex-col items-start gap-1 px-3 py-2 text-left whitespace-normal">
                <span>{portfolio.name}</span>
                <span className="text-xs text-muted-foreground">{portfolio.description}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button type="button" className="self-end" disabled={prediction === undefined}
            onClick={() => { if (prediction) onReveal(prediction); }}>
            Reveal outcomes
          </Button>
        </>
      ) : (
        <div className="flex flex-col gap-3" role="status">
          <p className="text-sm">{revealedPrediction === largerLoss.id ? 'You predicted it.' : 'Compare what happened.'} {largerLoss.name} lost more.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {portfolios.map((portfolio) => {
              const lossPercent = portfolio.exposurePercent * dropPercent / 100;
              const loss = startingBalance * lossPercent / 100;
              return (
                <Card key={portfolio.id} size="sm">
                  <CardHeader>
                    <CardTitle>{portfolio.name}</CardTitle>
                    <CardDescription>{portfolio.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1">
                    <span className="font-semibold tabular-nums">{coins.format(startingBalance - loss)} coins left</span>
                    <span className="text-loss tabular-nums">{loss > 0 ? '−' : ''}{coins.format(loss)} coins ({loss > 0 ? '−' : ''}{coins.format(lossPercent)}%)</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-sm font-semibold">What explains the difference?</p>
        </div>
      )}
    </div>
  );
}
