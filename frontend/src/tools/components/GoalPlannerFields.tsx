import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { addCalendarMonths } from '@/roadmap/calendar';
import { ToolAmountField } from './ToolFields';
import type { GoalPlannerDraft } from '../types';
import type { ToolErrors } from '../validation';

export function GoalPlannerFields({ draft, errors, today, onChange }: {
  readonly draft: GoalPlannerDraft;
  readonly errors: ToolErrors;
  readonly today: string;
  readonly onChange: (changes: Partial<GoalPlannerDraft>) => void;
}) {
  return (
    <FieldGroup>
      <ToolAmountField name="target" label="Target amount (EUR)" value={draft.target} error={errors.target} onChange={(target) => onChange({ target })} />
      <Field data-invalid={!!errors.goalDate}>
        <FieldLabel htmlFor="tool-goalDate">Goal date</FieldLabel>
        <Input id="tool-goalDate" type="date" value={draft.goalDate} min={today} max={addCalendarMonths(today, 600)} onChange={(event) => onChange({ goalDate: event.target.value, dateInputInvalid: event.target.validity.badInput })} aria-invalid={!!errors.goalDate} aria-describedby={`goalDate-help${errors.goalDate ? ' goalDate-error' : ''}`} />
        <FieldDescription id="goalDate-help">Today or a future date, within 50 years. Contributions start one calendar month from the calculation date.</FieldDescription>
        {errors.goalDate && <FieldError id="goalDate-error">{errors.goalDate}</FieldError>}
      </Field>
      <ToolAmountField name="saved" label="Already saved for this goal (EUR)" value={draft.saved} error={errors.saved} onChange={(saved) => onChange({ saved })} />
      <ToolAmountField name="monthlyContribution" label="Planned monthly contribution (EUR)" value={draft.monthlyContribution} error={errors.monthlyContribution} onChange={(monthlyContribution) => onChange({ monthlyContribution })} />
      <FieldSet>
        <FieldLegend>Optional illustrations</FieldLegend>
        <FieldDescription>The baseline does not need any return assumption. These are arithmetic illustrations, not forecasts. Disabled assumptions are ignored.</FieldDescription>
        {([
          ['returnEnabled', 'annualReturn', 'Illustrative annual return', draft.returnEnabled, draft.annualReturn],
          ['inflationEnabled', 'inflation', 'Inflation comparison', draft.inflationEnabled, draft.inflation],
        ] as const).map(([enabledField, rateField, label, enabled, value]) => (
          <FieldSet key={enabledField}>
            <FieldLegend id={`${enabledField}-legend`}>{label}</FieldLegend>
            <ToggleGroup variant="outline" value={[enabled ? 'on' : 'off']} onValueChange={(values) => { if (values[0]) onChange({ [enabledField]: values[0] === 'on' }); }} aria-labelledby={`${enabledField}-legend`}>
              <ToggleGroupItem value="off">Off</ToggleGroupItem><ToggleGroupItem value="on">Use my assumption</ToggleGroupItem>
            </ToggleGroup>
            {enabled && <ToolAmountField name={rateField} label={`${label} (%)`} value={value} error={errors[rateField]} signed={rateField === 'annualReturn'} onChange={(text) => onChange({ [rateField]: text })} description={`${rateField === 'annualReturn' ? '−90% to +50%' : '0% to 50%'}, effective annual percentage. Use a decimal point or comma, up to four decimal places; no thousands grouping. No value is recommended.`} />}
          </FieldSet>
        ))}
      </FieldSet>
    </FieldGroup>
  );
}
