import { useState } from 'react';
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatMoney } from '@/workspace/portfolio/money';
import type { GoalBrief } from '@/roadmap/types';
import type { BufferInput } from '../types';
import { ResultFacts } from './ResultFacts';
import { ToolConfirmDialog } from './ToolConfirmDialog';

export function BufferApplyDialog({ goal, input, onCancel, onConfirm }: {
  readonly goal: GoalBrief;
  readonly input: BufferInput;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  const [separation, setSeparation] = useState<string[]>([]);
  return (
    <ToolConfirmDialog open onOpenChange={(open) => { if (!open) onCancel(); }} title="Keep this buffer check?" description="This keeps the input facts alongside your goal. It does not replace your goal amount, date, contribution, savings, profile, or tasks." confirmLabel="Keep buffer check" disabled={separation[0] !== 'confirmed'} onConfirm={onConfirm}>
      <ResultFacts facts={[
        ['Essential expenses per month', formatMoney(input.monthlyExpensesCents)], ['Accessible buffer money', formatMoney(input.accessibleSavingsCents)],
        ['Earmarked expenses', formatMoney(input.earmarkedExpensesCents)], ['Chosen target', `${input.targetMonths} months`],
        ['Money currently recorded for your goal', goal.savedCents === undefined ? 'Not provided' : formatMoney(goal.savedCents)],
      ]} />
      <FieldSet>
        <FieldLegend id="money-separation">Money counted for different purposes</FieldLegend>
        <FieldDescription>This is your own check, not bank verification. Equal or different amounts cannot tell us whether the money overlaps. If the goal savings change later, we will ask you to review this.</FieldDescription>
        <ToggleGroup value={separation} onValueChange={setSeparation} variant="outline" aria-labelledby="money-separation" className="max-w-full flex-wrap">
          <ToggleGroupItem value="confirmed" className="h-auto min-h-10 max-w-full whitespace-normal px-3 py-2">I checked: buffer money is separate from goal money</ToggleGroupItem>
          <ToggleGroupItem value="review" className="h-auto min-h-10 whitespace-normal px-3 py-2">I need to review this</ToggleGroupItem>
        </ToggleGroup>
      </FieldSet>
    </ToolConfirmDialog>
  );
}
