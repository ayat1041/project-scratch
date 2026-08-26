"use client";

import { FieldValues, Path, useFormContext } from "react-hook-form";
import { cn } from "../../../lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Switch } from "../../ui/switch";
import { GAP_CLASS, GapValue } from "./gap-class";

interface SwitchFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  column?: boolean;
  longGap?: boolean;
  reverse?: boolean;
  gap?: GapValue;
}

/**
 * Switch bound to a `GenericForm` by field name.
 *
 * @example
 * ```tsx
 * <SwitchField name="isActive" label="Is Active" />
 * ```
 */
export const SwitchField = <T extends FieldValues>({
  name,
  label,
  className,
  required = false,
  disabled = false,
  column = false,
  longGap = false,
  reverse = false,
  gap = "2",
}: SwitchFieldProps<T>) => {
  const { control } = useFormContext<T>();

  return (
    <FormField
      name={name}
      control={control}
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
              <Switch
                className={cn(reverse ? "order-1" : "order-0")}
                onCheckedChange={field.onChange}
                id={name}
                checked={field.value}
                disabled={disabled}
              />
              {label && (
                <FormLabel
                  htmlFor={name}
                  className={cn(reverse ? "order-0" : "order-1")}
                >
                  <span>{label}</span>
                  {required && <span className="ml-1 text-destructive">*</span>}
                </FormLabel>
              )}
            </div>
          </FormControl>
          <FormMessage className="line-clamp-1 text-xs" />
        </FormItem>
      )}
    />
  );
};

SwitchField.displayName = "SwitchField";
