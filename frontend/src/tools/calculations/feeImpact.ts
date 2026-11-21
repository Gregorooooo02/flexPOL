import type { FeeInput } from '../types';
import { isFeeInput } from '../validation';

interface FeeOutcome { endingValueCents: number; feesDeductedCents: number }
export interface FeeImpactResult {
  input: FeeInput;
  months: number;
  optionA: FeeOutcome;
  optionB: FeeOutcome;
  noFee: FeeOutcome;
  /** A minus B, not a recommendation or a measure of product suitability. */
  differenceCents: number;
}

export function calculateFees(input: FeeInput): FeeImpactResult {
  if (!isFeeInput(input)) throw new RangeError('Invalid fee comparison inputs.');
  const months = input.years * 12;
  const monthlyGrowth = Math.exp(Math.log1p(input.annualReturn) / 12);
  function option(fee: number): FeeOutcome {
    const monthlyFee = -Math.expm1(Math.log1p(-fee) / 12);
    let value = input.initialCents;
    let fees = 0;
    for (let month = 0; month < months; month++) {
      const afterGrowth = value * monthlyGrowth;
      const deducted = afterGrowth * monthlyFee;
      fees += deducted;
      value = afterGrowth - deducted + input.monthlyContributionCents;
      if (![afterGrowth, value, fees].every((number) => Number.isFinite(number) && number >= 0 && Number.isSafeInteger(Math.round(number)))) {
        throw new RangeError('This comparison exceeds safe currency precision. Try a shorter horizon or smaller assumptions; no partial comparison is shown.');
      }
    }
    return { endingValueCents: value, feesDeductedCents: fees };
  }
  const optionA = option(input.feeA);
  const optionB = option(input.feeB);
  const noFee = option(0);
  return { input: { ...input }, months, optionA, optionB, noFee, differenceCents: optionA.endingValueCents - optionB.endingValueCents };
}
