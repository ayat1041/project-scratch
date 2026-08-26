"use client";

import { FieldValues, Path, useFormContext } from "react-hook-form";
import { cn } from "../../../lib/utils";
import { Checkbox } from "../../ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "../../ui/form";
import { GAP_CLASS, GapValue } from "./gap-class";

interface CheckboxFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  disabled?: boolean;
  column?: boolean;
  longGap?: boolean;
  reverse?: boolean;
  gap?: GapValue;
  className?: string;
}

/**
 * Checkbox bound to a `GenericForm` by field name.
 *
 * @example
 * ```tsx
 * <CheckboxField name="tnc" label="I agree to the terms and conditions" required />
 * ```
 */
export const CheckboxField = <T extends FieldValues>({
  name,
  label,
  disabled = false,
  required = false,
  column = false,
  longGap = false,
  reverse = false,
  gap = "2",
  className,
}: CheckboxFieldProps<T>) => {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormControl>
            <div
              className={cn(
                "relative flex items-center",
                GAP_CLASS[gap],
                column ? "flex-col items-start" : "",
                longGap ? "justify-between" : "",
              )}
            >
              <Checkbox
                className={cn(reverse ? "order-1" : "order-0")}
                onCheckedChange={field.onChange}
                id={name}
                checked={field.value}
                disabled={disabled}
              />
              <FormLabel
                htmlFor={name}
                className={cn(reverse ? "order-0" : "order-1")}
              >
                <span>{label}</span>
                {required && <span className="ml-1 text-destructive">*</span>}
              </FormLabel>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

CheckboxField.displayName = "CheckboxField";
