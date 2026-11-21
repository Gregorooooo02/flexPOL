import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function ToolAmountField({ name, label, value, error, description, onChange, integer = false, signed = false }: {
  readonly name: string;
  readonly label: string;
  readonly value: string;
  readonly error?: string;
  readonly description?: string;
  readonly onChange: (value: string) => void;
  readonly integer?: boolean;
  readonly signed?: boolean;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={`tool-${name}`}>{label}</FieldLabel>
      <Input id={`tool-${name}`} inputMode={signed ? 'text' : integer ? 'numeric' : 'decimal'} autoComplete="off" value={value} maxLength={integer ? 2 : 40} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={`${name}-help${error ? ` ${name}-error` : ''}`} />
      <FieldDescription id={`${name}-help`}>{description ?? 'EUR 0–1 billion. Enter 0 explicitly if none. Use 1250.50 or 1,250.50; one separator followed by three digits means thousands.'}</FieldDescription>
      {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
    </Field>
  );
}
