import { useId, useState } from 'react';
import type { DragEvent } from 'react';
import type { AssignmentExercise, Assignments } from '@/model';
import './exercise.css';

interface AssignmentQuestionProps {
  readonly exercise: AssignmentExercise;
  readonly assignments: Assignments;
  readonly locked: boolean;
  readonly solved: boolean;
  readonly onChange: (assignments: Assignments) => void;
  readonly onCheck: () => void;
}

function PriceTrace({ prices, min, max }: { prices: readonly number[]; min: number; max: number }) {
  const width = 200;
  const height = 50;
  const inset = 4;
  const span = max - min || 1;
  const y = (price: number) => height - inset - ((price - min) / span) * (height - inset * 2);
  const points = prices.map((price, index) => (
    `${inset + (index / (prices.length - 1)) * (width - inset * 2)},${y(price)}`
  )).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Prices in order: ${prices.join(', ')}`} className="exercise-trace">
      <line x1={inset} x2={width - inset} y1={y(prices[0])} y2={y(prices[0])} strokeDasharray="4 4" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export function AssignmentQuestion({ exercise, assignments, locked, solved, onChange, onCheck }: AssignmentQuestionProps) {
  const [selected, setSelected] = useState<string>();
  const [dragTarget, setDragTarget] = useState<string>();
  const heading = useId();
  const { cards, targets, mode } = exercise;
  const isMatching = mode === 'MATCH';
  const placed = cards.filter((card) => assignments[card.id] !== undefined).length;
  const allPrices = cards.flatMap((card) => card.prices ?? []);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const selectedCard = cards.find((card) => card.id === selected);

  function place(cardId: string, target: string) {
    if (locked || !cards.some((card) => card.id === cardId)) return;
    const previousTarget = assignments[cardId];
    const next = { ...assignments, [cardId]: target };
    if (isMatching) {
      const previousCard = cards.find((card) => card.id !== cardId && assignments[card.id] === target);
      if (previousCard) {
        if (previousTarget) next[previousCard.id] = previousTarget;
        else delete next[previousCard.id];
      }
    }
    if (!isMatching) setSelected(undefined);
    onChange(next);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>, target: string) {
    event.preventDefault();
    setDragTarget(undefined);
    place(event.dataTransfer.getData('application/x-hedgeflex-card'), target);
  }

  return (
    <section className="exercise-surface" aria-labelledby={heading}>
      <div className="exercise-top">
        <div>
          <h3 id={heading}>{isMatching ? 'Connect the pairs' : 'Sort the cards'}</h3>
          <p>{solved ? (isMatching ? 'All pairs connected.' : 'All cards sorted.') : selectedCard ? `Choose a ${isMatching ? 'match' : 'bin'} for ${selectedCard.text}.` : (
            isMatching ? 'Tap a card and its match, or drag to connect.' : 'Tap a card and a bin, or drag it into place.'
          )}</p>
        </div>
        <span className="exercise-counter" role="status">{placed}/{cards.length} {isMatching ? 'linked' : 'sorted'}</span>
      </div>
      <div className={isMatching ? 'pair-board' : 'sort-board'}>
        {isMatching && (
          <svg className="pair-wires" viewBox={`0 0 100 ${cards.length * 100}`} preserveAspectRatio="none" aria-hidden="true">
            {cards.map((card, index) => {
              const target = targets.findIndex((item) => item.id === assignments[card.id]);
              if (target === -1) return null;
              const from = index * 100 + 50;
              const to = target * 100 + 50;
              return <path key={`${card.id}-${target}`} d={`M 0 ${from} C 48 ${from}, 52 ${to}, 100 ${to}`} data-active={selected === card.id && !solved} />;
            })}
          </svg>
        )}
        {cards.map((card, index) => (
          <button key={card.id} type="button"
            className={isMatching ? 'exercise-tile pair-source' : 'exercise-tile sort-card'}
            style={isMatching ? { gridRow: index + 1 } : undefined}
            aria-pressed={selected === card.id && !solved}
            data-linked={assignments[card.id] !== undefined}
            disabled={locked}
            draggable={!locked}
            onClick={() => setSelected(selected === card.id ? undefined : card.id)}
            onDragStart={(event) => {
              event.dataTransfer.setData('application/x-hedgeflex-card', card.id);
              event.dataTransfer.effectAllowed = 'move';
              setSelected(card.id);
            }}
            onDragEnd={() => setDragTarget(undefined)}>
            <span>{card.text}</span>
            {card.prices && <PriceTrace prices={card.prices} min={min} max={max} />}
            {assignments[card.id] && <span className="sr-only">. Placed in {targets.find((target) => target.id === assignments[card.id])?.text}</span>}
            {isMatching && <span className="pair-port" aria-hidden="true" />}
          </button>
        ))}
        <div className={isMatching ? 'pair-targets' : 'sort-bins'}>
          {targets.map((target, index) => {
            const members = cards.filter((card) => assignments[card.id] === target.id);
            return (
              <button key={target.id} type="button"
                className={isMatching ? 'exercise-tile pair-target' : 'exercise-tile sort-bin'}
                style={isMatching ? { gridRow: index + 1 } : undefined}
                aria-label={target.text}
                data-linked={members.length > 0}
                data-ready={selectedCard !== undefined}
                data-drop={dragTarget === target.id}
                disabled={locked}
                onClick={() => { if (selected) place(selected, target.id); }}
                onDragOver={(event) => {
                  if (!event.dataTransfer.types.includes('application/x-hedgeflex-card')) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDragTarget(target.id);
                }}
                onDragLeave={() => setDragTarget(undefined)}
                onDrop={(event) => handleDrop(event, target.id)}>
                {isMatching && <span className="pair-port" aria-hidden="true" />}
                <span>{target.text}</span>
                {!isMatching && (
                  <span className="sort-members" aria-hidden="true">
                    {members.map((member) => <span key={member.id}>{member.text}</span>)}
                    {members.length === 0 && <span className="sort-empty">Drop here</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="exercise-bottom">
        {allPrices.length > 0 && <p>Every chart uses the same price scale.</p>}
        <button className="exercise-action" type="button" onClick={onCheck} disabled={locked || placed !== cards.length}>
          {solved ? 'Solved' : isMatching ? 'Check pairs' : 'Check sorting'} <span aria-hidden="true">{solved ? '✓' : '↗'}</span>
        </button>
      </div>
    </section>
  );
}
