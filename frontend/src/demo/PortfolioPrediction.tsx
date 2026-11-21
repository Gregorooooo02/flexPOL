import { useState } from 'react';
import type { PortfolioComparison } from '@/model';
import './exercise.css';

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
    <section className="exercise-surface" aria-label="Market shock">
      <div className="exercise-top">
        <div>
          <h3>{company} drops {dropPercent}%</h3>
          <p>Both portfolios start with {coins.format(startingBalance)} coins. All other prices hold steady.</p>
        </div>
      </div>
      {revealedPrediction === undefined ? (
        <>
          <div className="prediction-grid" role="group" aria-label="Which portfolio loses more?">
            {portfolios.map((portfolio) => (
              <button key={portfolio.id} type="button" className="exercise-tile prediction-tile"
                aria-pressed={prediction === portfolio.id} onClick={() => setPrediction(portfolio.id)}>
                <strong>{portfolio.name}</strong>
                <span>{portfolio.description}</span>
                <span className="lab-meter" aria-hidden="true"><span style={{ width: `${portfolio.exposurePercent}%` }} /></span>
              </button>
            ))}
          </div>
          <div className="exercise-bottom">
            <p>Which portfolio loses more?</p>
            <button className="exercise-action" type="button" disabled={prediction === undefined}
              onClick={() => { if (prediction) onReveal(prediction); }}>
              Reveal outcomes <span aria-hidden="true">↘</span>
            </button>
          </div>
        </>
      ) : (
        <div role="status">
          <div className="prediction-grid">
            {portfolios.map((portfolio) => {
              const lossPercent = portfolio.exposurePercent * dropPercent / 100;
              const loss = startingBalance * lossPercent / 100;
              return (
                <div key={portfolio.id} className="exercise-tile prediction-tile">
                  <strong>{portfolio.name}</strong>
                  <span>{coins.format(startingBalance - loss)} coins left</span>
                  <span className="lab-meter" aria-hidden="true"><span style={{ width: `${100 - lossPercent}%` }} /></span>
                  <strong className="prediction-loss">{loss > 0 ? '−' : ''}{coins.format(lossPercent)}%</strong>
                </div>
              );
            })}
          </div>
          <div className="exercise-bottom">
            <p>{revealedPrediction === largerLoss.id ? 'You predicted it.' : 'Compare what happened.'} {largerLoss.name} lost more.</p>
          </div>
        </div>
      )}
    </section>
  );
}
