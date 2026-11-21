import { FieldGroup } from '@/components/ui/field';
import type { FeeImpactDraft } from '../types';
import type { ToolErrors } from '../validation';
import { ToolAmountField } from './ToolFields';

export function FeeImpactFields({ draft, errors, onChange }: { readonly draft: FeeImpactDraft; readonly errors: ToolErrors; readonly onChange: (changes: Partial<FeeImpactDraft>) => void }) {
  return <FieldGroup>
    <ToolAmountField name="initialAmount" label="Starting amount (EUR)" value={draft.initialAmount} error={errors.initialAmount} onChange={(initialAmount) => onChange({ initialAmount })} />
    <ToolAmountField name="monthlyContribution" label="End-of-month contribution (EUR)" value={draft.monthlyContribution} error={errors.monthlyContribution} onChange={(monthlyContribution) => onChange({ monthlyContribution })} />
    <ToolAmountField name="years" label="Horizon (years)" value={draft.years} error={errors.years} onChange={(years) => onChange({ years })} integer description="A whole number from 1 to 50. Both options use the same timeline." />
    <ToolAmountField name="annualReturn" label="Assumed annual gross return (%)" value={draft.annualReturn} error={errors.annualReturn} onChange={(annualReturn) => onChange({ annualReturn })} signed description="Your illustration, not a forecast: −90% to +50%, effective annual rate. Decimal point/comma, up to four fractional digits; no grouping. Enter 0 explicitly for no growth." />
    <ToolAmountField name="feeA" label="Option A — annual percentage fee (%)" value={draft.feeA} error={errors.feeA} onChange={(feeA) => onChange({ feeA })} description="0% to 20%, up to four decimal places; no grouping. Only the annual proportional fee is modelled." />
    <ToolAmountField name="feeB" label="Option B — annual percentage fee (%)" value={draft.feeB} error={errors.feeB} onChange={(feeB) => onChange({ feeB })} description="0% to 20%, up to four decimal places; no grouping. Option B shares every other assumption with A." />
  </FieldGroup>;
}
