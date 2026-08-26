"use client";

import { FieldValues, Path, useFormContext } from "react-hook-form";
import { DateTimePicker } from "../../ui/datetime-picker";
import { FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";

interface DateFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Day-granularity date picker bound to a `GenericForm` by field name.
 *
 * @example
 * ```tsx
 * <DateField name="dob" label="Date of Birth" required />
 * ```
 */
export const DateField = <T extends FieldValues>({
  name,
  label,
  required = false,
  disabled = false,
}: DateFieldProps<T>) => {
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
            granularity="day"
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

DateField.displayName = "DateField";
