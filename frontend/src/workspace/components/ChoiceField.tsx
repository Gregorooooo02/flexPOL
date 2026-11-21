import { useId } from 'react';
import { cn } from 'cn';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChoiceFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  width?: 'full' | 'content';
}

export function ChoiceField({
  label,
  value,
  options,
  onChange,
  disabled = false,
  orientation = 'vertical',
  width = 'full',
}: ChoiceFieldProps) {
  const id = useId();
  return (
    <Field
      orientation={orientation}
      className={cn(
        'min-w-0 gap-1',
        orientation === 'horizontal' && 'items-baseline gap-2',
        width === 'content' && 'w-fit',
      )}
      data-disabled={disabled}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        disabled={disabled}
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <SelectTrigger
          id={id}
          className={width === 'content' ? 'w-fit shrink-0' : 'w-full'}
          disabled={disabled}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
