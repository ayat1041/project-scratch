"use client";

import { FieldValues, Path, useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface SelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  options: { value: string; text: string }[];
  required?: boolean;
  disabled?: boolean;
}

/**
 * Select bound to a `GenericForm` by field name.
 *
 * @example
 * ```tsx
 * <SelectField name="department" label="Department" options={departmentOptions} />
 * ```
 */
export const SelectField = <T extends FieldValues>({
  name,
  label,
  placeholder,
  options,
  required = false,
  disabled = false,
}: SelectFieldProps<T>) => {
  const { control } = useFormContext<T>();

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              <span>{label}</span>
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder ?? "Select an item"} />
              </SelectTrigger>
            </FormControl>

            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};

SelectField.displayName = "SelectField";
