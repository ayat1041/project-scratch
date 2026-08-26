"use client";

import { FieldValues, Path, useFormContext } from "react-hook-form";
import { cn } from "../../../lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { GAP_CLASS, GapValue } from "./gap-class";

type RadioOption = {
  value: string;
  text: string;
};

interface RadioGroupFieldProps<T extends FieldValues> {
  name: Path<T>;
  options: RadioOption[];
  label?: string;
  required?: boolean;
  className?: string;
  column?: boolean;
  longGap?: boolean;
  reverse?: boolean;
  gap?: GapValue;
  columnGroup?: boolean;
  rowGroup?: boolean;
}

/**
 * Radio group bound to a `GenericForm` by field name.
 *
 * @example
 * ```tsx
 * <RadioGroupField name="gender" options={genderOptions} rowGroup />
 * ```
 */
export const RadioGroupField = <T extends FieldValues>({
  name,
  options,
  label,
  required = false,
  className = "",
  column = false,
  longGap = false,
  reverse = false,
  columnGroup = true,
  rowGroup = false,
  gap = "2",
}: RadioGroupFieldProps<T>) => {
  const { control } = useFormContext<T>();

  if (options.length < 2) {
    return (
      <div className="text-destructive">
        Please provide at least two options for the radio group.
      </div>
    );
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              <span>{label}</span>
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className={cn(
                className,
                columnGroup ? "flex-col" : "",
                rowGroup ? "flex-row" : "",
                "flex gap-2",
              )}
            >
              {options.map((option) => (
                <FormItem key={option.value}>
                  <FormControl>
                    <div
                      className={cn(
                        "relative flex items-center",
                        GAP_CLASS[gap],
                        column ? "flex-col items-start" : "",
                        longGap ? "justify-between" : "",
                      )}
                    >
                      <RadioGroupItem
                        id={option.value}
                        className={cn(reverse ? "order-1" : "order-0")}
                        value={option.value}
                      />
                      <FormLabel
                        htmlFor={option.value}
                        className={cn(reverse ? "order-0" : "order-1")}
                      >
                        {option.text}
                      </FormLabel>
                    </div>
                  </FormControl>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

RadioGroupField.displayName = "RadioGroupField";
