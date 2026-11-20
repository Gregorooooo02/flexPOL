import type { HistoricalObservation } from '@/model';
import { historyPath } from '../history';

/** Decorative: the adjacent historical change supplies the accessible equivalent. */
export function Sparkline({ points }: { points: readonly HistoricalObservation[] }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 32" className="h-8 w-24 text-muted-foreground">
      <path
        d={historyPath(points, 96, 32, 48)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
