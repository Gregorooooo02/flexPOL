import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AssignmentExercise, Assignments } from '@/model';

interface AssignmentQuestionProps {
  readonly exercise: AssignmentExercise;
  readonly assignments: Assignments;
  readonly locked: boolean;
  readonly onChange: (assignments: Assignments) => void;
  readonly onCheck: () => void;
}

function PriceTrace({ prices, min, max }: { prices: readonly number[]; min: number; max: number }) {
  const width = 200;
  const height = 40;
  const padding = 3;
  const span = max - min || 1;
  const y = (price: number) => height - padding - ((price - min) / span) * (height - padding * 2);
  const points = prices.map((price, index) => (
    `${padding + (index / (prices.length - 1)) * (width - padding * 2)},${y(price)}`
  )).join(' ');

  return (
    <span className="block h-12 w-full">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Prices in order: ${prices.join(', ')}`} className="block size-full">
        <line x1={padding} x2={width - padding} y1={y(prices[0])} y2={y(prices[0])}
          className="stroke-muted-foreground/50" strokeDasharray="3 3" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function AssignmentQuestion({ exercise, assignments, locked, onChange, onCheck }: AssignmentQuestionProps) {
  const [selectedCard, setSelectedCard] = useState<string>();
  const id = useId();
  const { cards, targets, mode } = exercise;
  const isMatching = mode === 'MATCH';
  const placed = cards.filter((card) => assignments[card.id] !== undefined).length;
  const allPrices = cards.flatMap((card) => card.prices ?? []);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);

  function placeCard(values: readonly string[]) {
    const target = values[0];
    if (!selectedCard || !target || locked) return;
    const previousTarget = assignments[selectedCard];
    const next = { ...assignments, [selectedCard]: target };
    if (isMatching) {
      const previousCard = cards.find((card) => card.id !== selectedCard && assignments[card.id] === target);
      if (previousCard) {
        if (previousTarget) next[previousCard.id] = previousTarget;
        else delete next[previousCard.id];
      }
    }
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {isMatching ? 'Select a card, then choose its match.' : 'Select a goal, then choose its category.'}
        {allPrices.length > 0 && ' The charts share the same price scale.'}
      </p>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 id={`${id}-cards`} className="text-sm font-semibold">{isMatching ? 'Cards' : 'Goals'}</h3>
          <ToggleGroup aria-labelledby={`${id}-cards`} orientation="vertical" variant="outline"
            className="w-full" disabled={locked} value={selectedCard ? [selectedCard] : []}
            onValueChange={(values) => setSelectedCard(values[0])}>
            {cards.map((card) => {
              const placement = targets.find((target) => target.id === assignments[card.id]);
              return (
                <ToggleGroupItem key={card.id} value={card.id}
                  className="h-auto min-h-12 w-full flex-col items-start justify-center gap-1 px-3 py-2 text-left whitespace-normal">
                  <span>{card.text}</span>
                  {card.prices && <PriceTrace prices={card.prices} min={min} max={max} />}
                  {placement && <span className="text-xs text-muted-foreground">Placed in {placement.text}</span>}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 id={`${id}-targets`} className="text-sm font-semibold">{isMatching ? 'Matches' : 'Categories'}</h3>
          <ToggleGroup aria-labelledby={`${id}-targets`} orientation="vertical" variant="outline"
            className="w-full" disabled={locked || !selectedCard}
            value={selectedCard && assignments[selectedCard] ? [assignments[selectedCard]] : []}
            onValueChange={placeCard}>
            {targets.map((target) => (
              <ToggleGroupItem key={target.id} value={target.id}
                className="h-auto min-h-12 w-full justify-start px-3 py-2 text-left whitespace-normal">
                {target.text}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" role="status">{placed} of {cards.length} placed</p>
        <Button type="button" onClick={onCheck} disabled={locked || placed !== cards.length}>Check answer</Button>
      </div>
    </div>
  );
}
