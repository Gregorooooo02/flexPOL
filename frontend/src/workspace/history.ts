import type { HistoricalObservation } from '@/model';

export const HISTORY_RANGES = ['1M', '6M', '1Y', 'ALL'] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

const dateFormat = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Use original source dates: startup-relative display dates are not real market dates. */
export function formatHistoryDate(date: string): string {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

/** Discard unusable observations once, on arrival, without changing the response object. */
export function prepareHistory(points: HistoricalObservation[]): HistoricalObservation[] {
  return points
    .filter((point) => {
      const parsed = new Date(`${point.originalDate}T00:00:00Z`);
      return (
        Number.isFinite(point.value) &&
        point.value > 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(point.originalDate) &&
        Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === point.originalDate
      );
    })
    .sort((a, b) => a.originalDate.localeCompare(b.originalDate));
}

function monthsBefore(date: string, months: number): string {
  const end = new Date(`${date}T00:00:00Z`);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return end.toISOString().slice(0, 10);
}

export function historyForRange(
  points: readonly HistoricalObservation[],
  range: HistoryRange,
): readonly HistoricalObservation[] {
  if (range === 'ALL' || points.length < 2) return points;
  const cutoff = monthsBefore(
    points.at(-1)!.originalDate,
    range === '1M' ? 1 : range === '6M' ? 6 : 12,
  );
  const first = points.findIndex((point) => point.originalDate >= cutoff);
  // Include the preceding session when the boundary falls between observations.
  return points.slice(
    Math.max(0, first > 0 && points[first].originalDate !== cutoff ? first - 1 : first),
  );
}

export function historyChange(points: readonly HistoricalObservation[]): number | null {
  return points.length < 2 ? null : points.at(-1)!.value / points[0].value - 1;
}

export function pastYearChange(points: readonly HistoricalObservation[]): number | null {
  if (points.length < 2 || points[0].originalDate > monthsBefore(points.at(-1)!.originalDate, 12))
    return null;
  return historyChange(historyForRange(points, '1Y'));
}

/** SVG geometry shared by charts. Flat series use the centre line; retain both endpoints. */
export function historyPath(
  points: readonly HistoricalObservation[],
  width: number,
  height: number,
  samples = points.length,
): string {
  if (points.length < 2) return '';
  const count = Math.min(points.length, Math.max(2, samples));
  const values = points.map((point) => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const firstTime = Date.parse(`${points[0].originalDate}T00:00:00Z`);
  const span = Date.parse(`${points.at(-1)!.originalDate}T00:00:00Z`) - firstTime;
  return Array.from({ length: count }, (_, i) => {
    const index = Math.round((i * (points.length - 1)) / (count - 1));
    const point = points[index];
    const x =
      4 +
      (span > 0
        ? (Date.parse(`${point.originalDate}T00:00:00Z`) - firstTime) / span
        : i / (count - 1)) *
        (width - 8);
    const y =
      high === low ? height / 2 : 4 + (1 - (point.value - low) / (high - low)) * (height - 8);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}
