"use client";

import { Loader2, X } from "lucide-react";
import { ReactNode } from "react";
import { FieldValues, Path, useFormContext } from "react-hook-form";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";

type TextFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  type?: "text" | "email" | "number" | "password" | "tel";
  placeholder?: string;
  required?: boolean;
  action?: () => void;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
  inputClass?: string;
  disabled?: boolean;
};

/**
 * Text input bound to a `GenericForm` by field name — reads `control` from
 * `useFormContext()`, so no `control` prop is needed.
 *
 * @example
 * ```tsx
 * <TextField name="email" label="Email" type="email" required />
 * ```
 */
export const TextField = <T extends FieldValues>({
  name,
  label,
  type = "text",
  placeholder = "Enter a value",
  required = false,
  action,
  icon = <X size={16} className="text-muted-foreground" />,
  loading,
  className,
  inputClass,
  disabled = false,
}: TextFieldProps<T>) => {
  const { control } = useFormContext<T>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          {label && (
            <FormLabel htmlFor={name}>
              <span>{label}</span>
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative flex items-center gap-2">
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                className={cn("w-full", inputClass, action && "pr-12")}
                id={name}
                disabled={disabled}
              />

              {loading && (
                <Loader2 className="absolute right-4 h-4 w-4 animate-spin" />
              )}

              {action && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={action}
                  type="button"
                  className="absolute right-0.5 top-0.5"
                >
                  {icon}
                </Button>
              )}
            </div>
          </FormControl>

          <FormMessage className="line-clamp-1 text-xs" />
        </FormItem>
      )}
    />
  );
};

TextField.displayName = "TextField";
