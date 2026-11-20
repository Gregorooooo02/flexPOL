/** Money helpers. All amounts are integer cents; nothing here uses floating-point money arithmetic. */

export type Cents = number;

const MINUS = '\u2212';

const euroFormat = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
const percentFormat = new Intl.NumberFormat('en-IE', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** "€1,250.00"; negative amounts use a true minus sign. */
export function formatMoney(cents: Cents): string {
  const text = euroFormat.format(Math.abs(cents) / 100);
  return cents < 0 ? `${MINUS}${text}` : text;
}

/** Always shows the direction: "+€50.00", "−€50.00", or "€0.00" for zero. */
export function formatSignedMoney(cents: Cents): string {
  if (cents === 0) {
    return euroFormat.format(0);
  }
  const text = euroFormat.format(Math.abs(cents) / 100);
  return cents > 0 ? `+${text}` : `${MINUS}${text}`;
}

/** A fraction as a percentage: 0.125 gives "12.5%". */
export function formatPercent(fraction: number): string {
  const text = percentFormat.format(Math.abs(fraction));
  return fraction < 0 && Math.round(Math.abs(fraction) * 1000) > 0 ? `${MINUS}${text}` : text;
}

/** Like `formatPercent`, with a sign; a value that rounds to zero has none. */
export function formatSignedPercent(fraction: number): string {
  const text = percentFormat.format(Math.abs(fraction));
  if (Math.round(Math.abs(fraction) * 1000) === 0) {
    return text;
  }
  return fraction > 0 ? `+${text}` : `${MINUS}${text}`;
}

/** The share of `basisCents` that `valueCents` is, as a percentage (0 when the basis is not positive). */
export function percentOfBasis(valueCents: Cents, basisCents: Cents): number {
  return basisCents > 0 ? (valueCents / basisCents) * 100 : 0;
}

/** The amount in cents that a percentage of the basis represents. */
export function centsFromPercent(basisCents: Cents, percent: number): Cents {
  return Math.round((basisCents * percent) / 100);
}

/**
 * Parses what a user typed into an amount in cents, or null if it is not a valid non-negative
 * amount. Spaces and "€" are ignored.
 *
 * - If both "," and "." appear, the last one is the decimal separator.
 * - A single separator followed by exactly three digits is a thousands separator ("12,345" is
 *   12,345); otherwise it is a decimal separator ("12,5" is 12.50).
 * - Repeated separators of one kind are thousands separators.
 * - More than two decimals are rounded half-even to cents.
 */
export function parseAmountInput(text: string): Cents | null {
  const compact = text.replace(/[\s\u00a0€]/g, '');
  if (compact === '' || !/^[0-9.,]+$/.test(compact)) {
    return null;
  }

  const lastDot = compact.lastIndexOf('.');
  const lastComma = compact.lastIndexOf(',');
  const lastSeparator = Math.max(lastDot, lastComma);
  let decimalIndex = -1;
  if (lastDot >= 0 && lastComma >= 0) {
    decimalIndex = lastSeparator;
  } else if (lastSeparator >= 0) {
    const separator = compact[lastSeparator];
    const occurrences = compact.split(separator).length - 1;
    const digitsAfter = compact.length - lastSeparator - 1;
    if (occurrences === 1 && digitsAfter !== 3) {
      decimalIndex = lastSeparator;
    }
  }

  const integerDigits = (decimalIndex >= 0 ? compact.slice(0, decimalIndex) : compact).replace(/[.,]/g, '');
  const fractionDigits = decimalIndex >= 0 ? compact.slice(decimalIndex + 1).replace(/[.,]/g, '') : '';
  if (integerDigits === '' && fractionDigits === '') {
    return null;
  }

  const wholeUnits = integerDigits === '' ? 0 : Number(integerDigits);
  let cents = wholeUnits * 100 + Number((fractionDigits + '00').slice(0, 2));

  const rest = fractionDigits.slice(2);
  if (rest !== '') {
    const first = rest[0];
    const exactlyHalf = first === '5' && /^0*$/.test(rest.slice(1));
    if (first > '5' || (first === '5' && !exactlyHalf) || (exactlyHalf && cents % 2 === 1)) {
      cents += 1;
    }
  }
  return Number.isSafeInteger(cents) ? cents : null;
}
