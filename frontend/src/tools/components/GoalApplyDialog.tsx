import { formatMoney } from '@/workspace/portfolio/money';
import type { GoalBrief } from '@/roadmap/types';
import type { GoalPlannerInput } from '../types';
import { ToolConfirmDialog } from './ToolConfirmDialog';

export function GoalApplyDialog({ goal, input, onCancel, onConfirm }: {
  readonly goal: GoalBrief;
  readonly input: GoalPlannerInput;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  const money = (value: number | undefined) => value === undefined ? 'Not provided' : formatMoney(value);
  const changes = [
    ['Target', money(goal.targetCents), money(input.targetCents)], ['Goal date', goal.goalDate ?? 'Not provided', input.goalDate],
    ['Already saved', money(goal.savedCents), money(input.savedCents)], ['Planned monthly contribution', money(goal.monthlyContributionCents), money(input.monthlyContributionCents)],
  ];
  return (
    <ToolConfirmDialog open onOpenChange={(open) => { if (!open) onCancel(); }} title="Use these inputs in your roadmap?" description="Only the four entered facts change. Your goal name, profile, source, tasks and reflections stay intact. No projected outcome, assumed return or inflation is saved as a goal fact." confirmLabel="Apply goal inputs" onConfirm={onConfirm}>
      <dl className="flex min-w-0 flex-col gap-4">{changes.map(([label, previous, next]) => <div key={label} className="min-w-0"><dt className="font-semibold">{label}</dt><dd className="[overflow-wrap:anywhere]">Saved: {previous}<br />New: {next}</dd></div>)}</dl>
      <p>The new contribution is the amount you entered, not the calculated monthly amount needed.</p>
    </ToolConfirmDialog>
  );
}
