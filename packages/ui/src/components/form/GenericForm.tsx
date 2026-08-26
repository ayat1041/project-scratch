"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, Ref, useImperativeHandle } from "react";
import {
  Control,
  DefaultValues,
  FieldValues,
  FormState,
  Path,
  Resolver,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { z, ZodType } from "zod";
import { Form } from "../ui/form";

export type GenericFormRef<T extends FieldValues> = {
  getValues: () => T;
  reset: (values?: Partial<T>) => void;
  setValue: (name: keyof T, value: T[keyof T]) => void;
  formState: FormState<T>;
  control: Control<T>;
  form: UseFormReturn<T>;
};

export type GenericFormProps<TSchema extends ZodType<FieldValues, FieldValues>> = {
  schema: TSchema;
  initialValues: Partial<z.infer<TSchema>>;
  onSubmit: SubmitHandler<z.infer<TSchema>>;
  children: ReactNode;
  ref?: Ref<GenericFormRef<z.infer<TSchema>>>;
} & Omit<React.ComponentPropsWithoutRef<"form">, "onSubmit">;

/**
 * Schema-driven form shell: wires react-hook-form + zodResolver from a single Zod
 * schema, wraps children in the shadcn `Form` provider, and exposes an imperative
 * ref (getValues/reset/setValue/formState/control/form) for parent-triggered actions.
 * Pair with the field components in `./fields` — they read `control` from
 * `useFormContext()` instead of taking it as a prop.
 *
 * @example
 * ```tsx
 * const formRef = useRef<GenericFormRef<FormType>>(null);
 * <GenericForm ref={formRef} schema={schema} initialValues={initialValues} onSubmit={onSubmit}>
 *   <TextField name="name" label="Name" />
 *   <SubmitButton />
 * </GenericForm>
 * ```
 */
export const GenericForm = <TSchema extends ZodType<FieldValues, FieldValues>>({
  ref,
  initialValues,
  schema,
  onSubmit,
  children,
  ...formProps
}: GenericFormProps<TSchema>) => {
  type TFormValues = z.infer<TSchema>;

  const form = useForm<TFormValues>({
    defaultValues: initialValues as DefaultValues<TFormValues>,
    // zodResolver can't propagate a still-abstract generic TSchema's inferred output through
    // its own generic inference, so its return type here always widens to the FieldValues base —
    // a known limitation when zodResolver is called inside a generic wrapper like this one.
    resolver: zodResolver(schema) as unknown as Resolver<TFormValues>,
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        getValues: form.getValues,
        reset: (values?: Partial<TFormValues>) =>
          form.reset(values as TFormValues),
        setValue: (name: keyof TFormValues, value: TFormValues[keyof TFormValues]) =>
          form.setValue(name as Path<TFormValues>, value),
        formState: form.formState,
        control: form.control,
        form,
      };
    },
    [form],
  );

  return (
    <Form {...form}>
      <form {...formProps} onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </Form>
  );
};

GenericForm.displayName = "GenericForm";
