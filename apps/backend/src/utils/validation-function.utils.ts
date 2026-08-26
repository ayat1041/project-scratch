import { Request } from "express";
import z from "zod";
import parseRequestedFields from "./convert-requested-fields.utils";
import { appCountriesTable } from "@/db/schema";
export const ALLOWED_COUNTRY_FIELDS = Object.keys(appCountriesTable);
import { createError } from "@/middleware/error.middleware";
import { incomingRequestValidationSchema } from "@repo/schemas-types/payload-schemas/common/payload.schema";

// export const incomingRequestValidationSchema = (allowedFields: string[]) =>
//   z.object({
//     limit: z
//       .union([
//         z.number().min(0, {
//           message: "limit must be a non-negative number or 'all'",
//         }),
//         z.literal("all"),
//       ])
//       .default(10)
//       .refine((val) => typeof val === "number" || val === "all", {
//         message: "limit must be a non-negative number or 'all'",
//       }),
//     offset: z
//       .number()
//       .min(0, { message: "offset must be a non-negative number" })
//       .default(0),
//     fields: z
//       .array(z.string())
//       .optional()
//       .refine(
//         (arr) =>
//           arr === undefined || arr.every((f) => allowedFields.includes(f)),
//         {
//           message: `fields must be one of: ${allowedFields.join(", ")}`,
//         },
//       )
//       .transform((fields) => fields?.map((f) => sanitizeHtml(f))),
//     search: z
//       .string()
//       .optional()
//       .transform((val) => {
//         if (val === undefined) return val;
//         return sanitizeHtml(val);
//       }),
//     // orderBy provided as two separate query params: orderByField and orderByDirection
//     sortField: z
//       .string()
//       .optional()
//       .refine((f) => f === undefined || allowedFields.includes(f), {
//         message: `sortField must be one of: ${allowedFields.join(", ")}`,
//       })
//       .transform((val) => {
//         if (val === undefined) return undefined;
//         return sanitizeHtml(val);
//       }),
//     sortOrder: z.enum(["asc", "desc"]).default("asc").optional(),
//     countTotal: z
//       .string()
//       .transform((val) => {
//         val = sanitizeHtml(val);
//         if (val === "true") return true;
//         return false;
//       })
//       .optional(),
//   });

export type IncomingRequestValidationParams = z.infer<
  ReturnType<typeof incomingRequestValidationSchema>
>;

export const validateIncomingRequests = <
  T extends z.ZodRawShape = Record<never, never>,
>(
  allowedFields: string[],
  extraSchema?: T,
) => {
  return async (req: Request) => {
    const {
      limit,
      offset,
      fields,
      countTotal,
      search,
      sortField,
      sortOrder,
      ...restQuery
    } = req.query;
    const limitValue = limit ? parseInt(limit as string, 10) : 10;
    const offsetValue = offset ? parseInt(offset as string, 10) : 0;
    const requestedFields = parseRequestedFields(fields as string);
    const baseSchema = incomingRequestValidationSchema(allowedFields);
    const validationSchema = extraSchema
      ? baseSchema.extend(extraSchema)
      : baseSchema;
    const validation = validationSchema.safeParse({
      limit: limitValue,
      offset: offsetValue,
      fields: requestedFields,
      countTotal,
      search,
      sortField,
      sortOrder,
      ...req.params,
      ...restQuery,
    });
    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((err) => err.message)
        .join(", ");
      throw createError.validation(errorMessage);
    }

    return validation.data as IncomingRequestValidationParams &
      z.infer<z.ZodObject<T>>;
  };
};
