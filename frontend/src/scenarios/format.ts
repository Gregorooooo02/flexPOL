import { formatMoney } from '@/workspace/portfolio/money';

/** Scenario amounts arrive as euros (JSON numbers); the shared money helpers work in cents. */
export function formatEuros(euros: number): string {
  return formatMoney(Math.round(euros * 100));
}

/**
 * A span of calendar days in words: "about 9 months", "1 year", "about 9.5 years".
 * Whole years are shown without "about" when they are within a few days.
 */
export function formatDays(days: number): string {
  if (days < 365) {
    const months = Math.max(1, Math.round(days / (365.25 / 12)));
    return `about ${months} ${months === 1 ? 'month' : 'months'}`;
  }
  const years = days / 365.25;
  const wholeYears = Math.round(years);
  if (Math.abs(years - wholeYears) * 365.25 <= 3) {
    return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
  }
  return `about ${years.toFixed(1)} years`;
}

const shareFormat = new Intl.NumberFormat('en-IE', { style: 'percent', maximumFractionDigits: 1 });

/** A fraction as a compact percentage: 0.5 gives "50%", 0.125 gives "12.5%". */
export function formatShare(fraction: number): string {
  return shareFormat.format(fraction);
}

const dayCount = new Intl.NumberFormat('en-IE');

/** "365 days" with thousands separators. */
export function formatDayCount(days: number): string {
  return `${dayCount.format(days)} ${days === 1 ? 'day' : 'days'}`;
}
