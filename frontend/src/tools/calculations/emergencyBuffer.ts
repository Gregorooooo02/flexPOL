import { isBufferInput } from '../validation';
import type { BufferInput } from '../types';

export interface EmergencyBufferResult {
  availableBufferCents: number;
  expenseShortfallCents: number;
  monthsCovered: number | null;
  targetAmountCents: number;
  bufferGapCents: number;
}

export function calculateBuffer(input: BufferInput): EmergencyBufferResult {
  if (!isBufferInput(input)) throw new RangeError('Invalid emergency buffer inputs.');
  const net = input.accessibleSavingsCents - input.earmarkedExpensesCents;
  const availableBufferCents = Math.max(0, net);
  const targetAmountCents = input.targetMonths * input.monthlyExpensesCents;
  return {
    availableBufferCents, expenseShortfallCents: Math.max(0, -net),
    monthsCovered: input.monthlyExpensesCents === 0 ? null : availableBufferCents / input.monthlyExpensesCents,
    targetAmountCents, bufferGapCents: Math.max(0, targetAmountCents - availableBufferCents),
  };
}
