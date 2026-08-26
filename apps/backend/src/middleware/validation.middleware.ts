import { createError } from "@/middleware/error.middleware";
import { z } from "zod";

/**
 * Validates input against a Zod schema and throws unique error messages.
 */
export type ZodValidationResult<T> =
  | { success: true; data: T; errors: null }
  | { success: false; data: null; errors: string };

export const validateZodSchema = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
) => {
  return (data: unknown): z.infer<TSchema> => {
    const validation = schema.safeParse(data);

    if (!validation.success) {
      const uniqueMessages = Array.from(
        new Set(
          validation.error.issues.map(
            (err) => `${err.path.map((segment) => String(segment)).join(".")}: ${err.message}`,
          ),
        ),
      );

      // Format as consistent error object
      const errorMessage = uniqueMessages.join("(-)");

      throw createError.validation(errorMessage, errorMessage);
    }

    return validation.data;
  };
};

export const validateZodSchemaWithoutThrowingError = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
) => {
  return (data: unknown): ZodValidationResult<z.infer<TSchema>> => {
    const validation = schema.safeParse(data);

    if (!validation.success) {
      const uniqueMessages = Array.from(
        new Set(
          validation.error.issues.map(
            (err) => `${err.path.map((segment) => String(segment)).join(".")}: ${err.message}`,
          ),
        ),
      );

      // Format as consistent error object
      const errorMessage = uniqueMessages.join(", ");
      return {
        success: false,
        data: null,
        errors: errorMessage,
      };
    }

    return {
      success: true,
      data: validation.data,
      errors: null,
    };
  };
};
