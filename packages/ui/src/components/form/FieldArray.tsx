"use client";

import { ReactNode } from "react";
import {
  ArrayPath,
  FieldValues,
  useFieldArray,
  UseFieldArrayReturn,
  useFormContext,
} from "react-hook-form";

type FieldArrayProps<T extends FieldValues> = {
  children: (field: UseFieldArrayReturn<T, ArrayPath<T>>) => ReactNode;
  name: ArrayPath<T>;
};

/**
 * Render-prop wrapper around react-hook-form's `useFieldArray`, for repeatable
 * groups (work history, line items, etc.) inside a `GenericForm`.
 *
 * @example
 * ```tsx
 * <FieldArray name="items">
 *   {({ fields, append, remove }) =>
 *     fields.map((field, index) => (
 *       <TextField key={field.id} name={`items.${index}.name`} />
 *     ))
 *   }
 * </FieldArray>
 * ```
 */
export const FieldArray = <T extends FieldValues>({
  children,
  name,
}: FieldArrayProps<T>) => {
  const { control } = useFormContext<T>();
  const fieldArray = useFieldArray({ control, name });

  return children(fieldArray);
};

FieldArray.displayName = "FieldArray";
