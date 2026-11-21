import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { RoadmapSetupDraft } from '../types';
import type { SetupErrors } from '../validation';
import { addCalendarMonths } from '../calendar';

export function GoalFields({ draft, errors, today, onChange }: {
  readonly draft: RoadmapSetupDraft;
  readonly errors: SetupErrors;
  readonly today: string;
  readonly onChange: (changes: Partial<RoadmapSetupDraft>) => void;
}) {
  return (
    <FieldGroup>
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="goal-title">Goal name (required)</FieldLabel>
        <Input id="goal-title" value={draft.title} maxLength={80} autoComplete="off" onChange={(event) => onChange({ title: event.target.value })} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} />
        {errors.title && <FieldError id="title-error">{errors.title}</FieldError>}
      </Field>
      {([
        ['targetAmount', 'Target amount (EUR, optional)', 'An amount you would like to work toward. Leave blank if you do not know yet.'],
        ['savedAmount', 'Already set aside (EUR, optional)', 'Only money designated for this goal. Do not also count it as an emergency buffer.'],
        ['monthlyContribution', 'Monthly contribution (EUR, optional)', 'A contribution you are considering, not a recommended amount.'],
      ] as const).map(([field, label, description]) => (
        <Field key={field} data-invalid={!!errors[field]}>
          <FieldLabel htmlFor={`goal-${field}`}>{label}</FieldLabel>
          <Input id={`goal-${field}`} inputMode="decimal" autoComplete="off" maxLength={40} value={draft[field]} onChange={(event) => onChange({ [field]: event.target.value })} aria-invalid={!!errors[field]} aria-describedby={`${field}-help${errors[field] ? ` ${field}-error` : ''}`} />
          <FieldDescription id={`${field}-help`}>{description} Use 1250.50 or 1,250.50; one separator followed by exactly three digits means thousands. Zero is different from blank.</FieldDescription>
          {errors[field] && <FieldError id={`${field}-error`}>{errors[field]}</FieldError>}
        </Field>
      ))}
      <Field data-invalid={!!errors.goalDate}>
        <FieldLabel htmlFor="goal-goalDate">Goal date (optional)</FieldLabel>
        <Input id="goal-goalDate" type="date" value={draft.goalDate} max={addCalendarMonths(today, 600)} onChange={(event) => onChange({ goalDate: event.target.value, dateInputInvalid: event.target.validity.badInput })} aria-invalid={!!errors.goalDate} aria-describedby={`date-help${errors.goalDate ? ' date-error' : ''}`} />
        <FieldDescription id="date-help">Choose today or a future date, within 50 years. You can leave the date open.</FieldDescription>
        {draft.goalDate && draft.goalDate < today && <FieldDescription>Your saved date is in the past. Review whether it still reflects your goal.</FieldDescription>}
        {errors.goalDate && <FieldError id="date-error">{errors.goalDate}</FieldError>}
      </Field>
    </FieldGroup>
  );
}
