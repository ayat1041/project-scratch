"use client";

import { FieldValues, Path, useFormContext } from "react-hook-form";
import { DateTimePicker } from "../../ui/datetime-picker";
import { FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";

interface DateTimeFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Full date + time picker bound to a `GenericForm` by field name.
 *
 * @example
 * ```tsx
 * <DateTimeField name="scheduledAt" label="Scheduled At" />
 * ```
 */
export const DateTimeField = <T extends FieldValues>({
  name,
  label,
  required = false,
  disabled = false,
}: DateTimeFieldProps<T>) => {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          {label && (
            <FormLabel htmlFor={name}>
              <span>{label}</span>
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <DateTimePicker
            disabled={disabled}
            value={field.value}
            onChange={field.onChange}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

DateTimeField.displayName = "DateTimeField";
