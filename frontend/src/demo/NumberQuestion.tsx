import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import type { NumberExercise, NumberLab } from '@/model';
import './exercise.css';

const amount = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
type LabProps = { readonly lab: NumberLab; readonly value: number };

function TimeMachine({ lab, value }: LabProps) {
  if (lab.kind !== 'COMPOUNDING') return null;
  const balanceAt = (year: number) => lab.balance * (1 + lab.rate / 100) ** year;
  const width = 352;
  const height = 104;
  const x = (year: number) => 8 + (year / lab.max) * (width - 16);
  const span = balanceAt(lab.max) - lab.balance || 1;
  const y = (year: number) => height - 12 - (balanceAt(year) - lab.balance) / span * (height - 24);
  const path = Array.from({ length: value + 1 }, (_, year) => `${year === 0 ? 'M' : 'L'} ${x(year)} ${y(year)}`).join(' ');

  return (
    <div className="time-machine">
      <div className="lab-metric">
        <span>After {value} {value === 1 ? 'year' : 'years'}</span>
        <strong>{amount.format(balanceAt(value))} <small>coins</small></strong>
        <span>Started with {amount.format(lab.balance)} · grows {lab.rate}% per year</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="time-curve" aria-hidden="true">
        <path d={`M 8 ${y(0)} H ${width - 8}`} className="time-baseline" />
        <path d={`${path} L ${x(value)} ${y(0)} Z`} className="time-fill" />
        <path d={path} className="time-line" />
        <circle cx={x(value)} cy={y(value)} r="5" />
      </svg>
    </div>
  );
}

function SplitMeter({ share, label }: { share: number; label: string }) {
  return <div className="lab-meter" role="img" aria-label={label}><span style={{ width: `${share}%` }} /></div>;
}

function Lockbox({ lab, value }: LabProps) {
  if (lab.kind !== 'LOCKBOX') return null;
  const available = lab.balance - value;
  const gap = lab.bill - available;
  return (
    <div className="lockbox-stage">
      <div className="lab-pockets">
        <div className="lab-metric">
          <span>In your pocket</span><strong>{amount.format(available)} <small>coins</small></strong>
        </div>
        <div className="lab-metric">
          <span>In the lockbox</span><strong>{amount.format(value)} <small>coins</small></strong>
        </div>
      </div>
      <SplitMeter share={available / lab.balance * 100} label={`${available} accessible coins, ${value} locked coins`} />
      <p className="lab-notice" data-loss={gap > 0}>
        {gap > 0 ? `Short by ${amount.format(gap)} coins` : `Bill covered · ${amount.format(available - lab.bill)} spare coins`}
      </p>
    </div>
  );
}

function ShockMeter({ lab, value }: LabProps) {
  if (lab.kind !== 'SHOCK') return null;
  const loss = value * lab.rate / 100;
  return (
    <div className="shock-stage">
      <div className="lab-pockets">
        <div className="lab-metric"><span>In Nova Robotics</span><strong>{value}<small>%</small></strong></div>
        <div className="lab-metric"><span>In the rest of the basket</span><strong>{100 - value}<small>%</small></strong></div>
      </div>
      <SplitMeter share={value} label={`${value}% in Nova Robotics, ${100 - value}% in other companies`} />
      <p className="lab-notice" data-loss={loss > 0}>After the drop · {amount.format(lab.balance * (1 - loss / 100))} coins left ({loss > 0 ? '−' : ''}{amount.format(loss)}%)</p>
    </div>
  );
}

const LAB_TITLES = { COMPOUNDING: 'Time machine', LOCKBOX: 'The lockbox', SHOCK: 'Crash test' };

interface NumberQuestionProps {
  readonly exercise: NumberExercise;
  readonly lastValue?: number;
  readonly locked: boolean;
  readonly solved: boolean;
  readonly onCheck: (value: number) => void;
}

export function NumberQuestion({ exercise, lastValue, locked, solved, onCheck }: NumberQuestionProps) {
  const { lab, dial, label, unit } = exercise;
  const { max, step } = lab ?? dial;
  const [value, setValue] = useState(() => lastValue ?? lab?.initial ?? 0);
  const id = useId();
  const displayValue = `${amount.format(value)}${unit === '%' ? '' : ' '}${unit}`;

  return (
    <section className="exercise-surface" aria-labelledby={`${id}-label`}>
      {lab && (
        <div className="exercise-top"><h3>{LAB_TITLES[lab.kind]}</h3></div>
      )}
      {lab?.kind === 'COMPOUNDING' && <TimeMachine lab={lab} value={value} />}
      {lab?.kind === 'LOCKBOX' && <Lockbox lab={lab} value={value} />}
      {lab?.kind === 'SHOCK' && <ShockMeter lab={lab} value={value} />}
      <div className="lab-slider" data-has-lab={Boolean(lab)}>
        <label id={`${id}-label`} htmlFor={id}>{label}</label>
        {dial ? (
          <div className="number-stepper">
            <button type="button" aria-label={`Decrease by ${step}`} disabled={locked || value === 0}
              onClick={() => setValue((current) => Math.max(0, current - step))}>−</button>
            <output htmlFor={id}>{displayValue}</output>
            <button type="button" aria-label={`Increase by ${step}`} disabled={locked || value === max}
              onClick={() => setValue((current) => Math.min(max, current + step))}>+</button>
          </div>
        ) : <output htmlFor={id}>{displayValue}</output>}
        <input id={id} type="range" min={0} max={max} step={step} value={value}
          aria-valuetext={displayValue} disabled={locked}
          style={{ '--slider-fill': `${value / max * 100}%` } as CSSProperties}
          onChange={(event) => setValue(event.currentTarget.valueAsNumber)} />
        <span>0</span><span>{amount.format(max)}{unit === '%' ? '' : ' '}{unit}</span>
      </div>
      <div className="exercise-bottom">
        <button className="exercise-action" type="button" disabled={locked} onClick={() => onCheck(value)}>
          {solved ? 'Solved' : 'Check answer'} {solved && <span aria-hidden="true">✓</span>}
        </button>
      </div>
    </section>
  );
}
