/** "€6,000" for whole amounts, "€6,000.50" when there are cents. */
export function formatAmount(amount: number, currency: string): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

/** Calendar days as a rounded period: "9 months", "1 year", "9½ years". */
export function formatPeriod(days: number): string {
  if (days < 365) {
    const months = Math.max(1, Math.round(days / 30.44));
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  const halfYears = Math.round(days / 182.625);
  const years = Math.floor(halfYears / 2);
  return `${halfYears % 2 === 1 ? `${years}½` : years} ${halfYears === 2 ? 'year' : 'years'}`;
}

/** "3 funds · 1 stock" for the allowed instruments. */
export function describeInstrumentMix(assetClasses: readonly string[]): string {
  const funds = assetClasses.filter((assetClass) => assetClass === 'EQUITY_ETF').length;
  const stocks = assetClasses.filter((assetClass) => assetClass === 'STOCK').length;
  const other = assetClasses.length - funds - stocks;
  return [
    funds > 0 && `${funds} ${funds === 1 ? 'fund' : 'funds'}`,
    stocks > 0 && `${stocks} ${stocks === 1 ? 'stock' : 'stocks'}`,
    other > 0 && `${other} other`,
  ]
    .filter(Boolean)
    .join(' · ');
}
