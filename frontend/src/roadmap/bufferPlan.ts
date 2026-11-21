import type { BufferPlan, GoalBrief } from './types';

/** Review is sticky, even if savings are later changed back to their original amount. */
export function preserveBufferPlan(buffer: BufferPlan | null, goal: GoalBrief): BufferPlan | null {
  if (!buffer || buffer.goalId !== goal.id) return null;
  return buffer.goalSavedCentsAtConfirmation !== goal.savedCents ? { ...buffer, separationNeedsReview: true } : buffer;
}
