"use client";

import { Loader2, LucideIcon, X } from "lucide-react";
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
import { Textarea } from "../../ui/textarea";

interface TextareaFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  required?: boolean;
  placeholder?: string;
  resizable?: boolean;
  showCount?: boolean;
  maxLength?: number;
  action?: () => void;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  inputClassName?: string;
}

/**
 * Textarea bound to a `GenericForm` by field name.
 *
 * @example
 * ```tsx
 * <TextareaField name="message" label="Message" showCount maxLength={280} />
 * ```
 */
export const TextareaField = <T extends FieldValues>({
  name,
  label,
  placeholder = "Enter a value",
  required = false,
  resizable = false,
  showCount = false,
  maxLength,
  action,
  icon: Icon = X,
  loading,
  className,
  inputClassName,
}: TextareaFieldProps<T>) => {
  const { control } = useFormContext<T>();

  return (
    <FormField
      name={name}
      control={control}
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
              <Textarea
                {...field}
                id={name}
                placeholder={placeholder}
                className={cn(
                  "w-full",
                  action && "pr-12",
                  resizable === false && "resize-none",
                  inputClassName,
                )}
                showCount={showCount}
                maxLength={maxLength}
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
                  <Icon size={16} className="text-muted-foreground" />
                </Button>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

TextareaField.displayName = "TextareaField";
