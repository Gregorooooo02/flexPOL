import { FieldGroup } from '@/components/ui/field';
import { ToolAmountField } from './ToolFields';
import type { EmergencyBufferDraft } from '../types';
import type { ToolErrors } from '../validation';

export function EmergencyBufferFields({ draft, errors, onChange }: {
  readonly draft: EmergencyBufferDraft;
  readonly errors: ToolErrors;
  readonly onChange: (changes: Partial<EmergencyBufferDraft>) => void;
}) {
  return (
    <FieldGroup>
      <ToolAmountField name="monthlyExpenses" label="Essential monthly expenses (EUR)" value={draft.monthlyExpenses} error={errors.monthlyExpenses} onChange={(monthlyExpenses) => onChange({ monthlyExpenses })} />
      <ToolAmountField name="accessibleSavings" label="Accessible money designated for this buffer (EUR)" value={draft.accessibleSavings} error={errors.accessibleSavings} onChange={(accessibleSavings) => onChange({ accessibleSavings })} description="Exclude money assigned to other goals. This is not automatically copied from your roadmap. EUR 0–1 billion; enter zero explicitly. Use 1250.50 or 1,250.50." />
      <ToolAmountField name="earmarkedExpenses" label="Separately earmarked upcoming expenses (EUR)" value={draft.earmarkedExpenses} error={errors.earmarkedExpenses} onChange={(earmarkedExpenses) => onChange({ earmarkedExpenses })} description="Include only unavoidable expenses not already included in monthly expenses or deducted from the accessible amount. EUR 0–1 billion; enter zero explicitly." />
      <ToolAmountField name="targetMonths" label="Your buffer target (months)" value={draft.targetMonths} error={errors.targetMonths} onChange={(targetMonths) => onChange({ targetMonths })} integer description="Choose a whole number from 0 to 60. There is no universal recommended target; this is your own choice." />
    </FieldGroup>
  );
}
