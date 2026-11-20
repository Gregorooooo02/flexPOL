import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Slider } from '@/components/ui/slider';
import { centsFromPercent, formatMoney, formatPercent, percentOfBasis } from '../portfolio/money';

interface AmountFieldProps {
  text: string;
  cents: number | null;
  basisCents: number;
  maxCents: number;
  error?: string;
  onTextChange: (text: string) => void;
}

/** A controlled target position size. Only user input converts a percentage back into cents. */
export function AmountField({
  text,
  cents,
  basisCents,
  maxCents,
  error,
  onTextChange,
}: AmountFieldProps) {
  const id = useId();
  const percent = Math.min(100, Math.max(0, percentOfBasis(cents ?? 0, basisCents)));
  const setAmount = (value: number) => onTextChange((value / 100).toFixed(2));
  return (
    <FieldGroup className="gap-4">
      <Field data-invalid={Boolean(error)} className="gap-2">
        <FieldLabel htmlFor={id}>Target position (EUR)</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>€</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={id}
            inputMode="decimal"
            autoComplete="off"
            maxLength={40}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
          />
        </InputGroup>
        <FieldDescription id={`${id}-help`}>
          Set the total amount to hold, not an additional purchase. Maximum {formatMoney(maxCents)}.
        </FieldDescription>
        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      </Field>
      <Field className="gap-3" data-disabled={maxCents === 0}>
        <FieldLabel id={`${id}-share`}>
          Share of portfolio · {formatPercent((cents ?? 0) / (basisCents || 1))}
        </FieldLabel>
        <Slider
          value={[percent]}
          min={0}
          max={100}
          step={1}
          disabled={maxCents === 0}
          thumbProps={{
            'aria-labelledby': `${id}-share`,
            'aria-valuetext': `${formatMoney(cents ?? 0)}, ${formatPercent(percent / 100)} of portfolio`,
          }}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;
            setAmount(Math.min(maxCents, centsFromPercent(basisCents, next)));
          }}
        />
        {maxCents < basisCents && (
          <FieldDescription>
            Limited by available cash. Other positions are not changed automatically.
          </FieldDescription>
        )}
      </Field>
      <div role="group" aria-label="Quick allocation" className="flex flex-wrap gap-2">
        {[0, 25, 50].map((value) => (
          <Button
            key={value}
            type="button"
            size="xs"
            variant="outline"
            disabled={value > 0 && centsFromPercent(basisCents, value) > maxCents}
            onClick={() => setAmount(centsFromPercent(basisCents, value))}
          >
            {value}%
          </Button>
        ))}
        <Button type="button" size="xs" variant="outline" onClick={() => setAmount(maxCents)}>
          Max
        </Button>
      </div>
    </FieldGroup>
  );
}
