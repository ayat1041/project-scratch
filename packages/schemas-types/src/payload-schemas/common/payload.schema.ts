import z from "zod";
import sanitizeHtml from "sanitize-html";

export const resourceIdValidationSchema = z.uuid({ error: "Invalid resource ID format" });

export const StandardApiResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.unknown().optional(),
});
export type StandardApiResponse = z.infer<typeof StandardApiResponseSchema>;

export const PaginationSchema = z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    totalItems: z.number().int(),
    totalPages: z.number().int(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const LabeledCountSchema = z.object({
    label: z.string(),
    value: z.string(),
    count: z.number().int(),
});
export type LabeledCount = z.infer<typeof LabeledCountSchema>;

export interface ErrorWithStatus extends Error {
    status: number;
    statusCode: number;
}

export const labelValidationSchema = z.object({
    label: z.string().max(50, { error: "Label must be at most 50 characters long" }),
});

export const paginationQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100, {
        message: "limit must be less than or equal to 100",
    }).optional().default(10),
    offset: z.coerce.number().int().nonnegative().optional().default(0),
    search: z.string().max(100, { error: "Maximum 100 characters allowed." })
        .transform((val) => sanitizeHtml(val).toLowerCase().trim())
        .optional(),
    sortOrder: z.enum(["asc", "desc"], { error: "Invalid sort order selected." }).optional(),
});

export const incomingRequestValidationSchema = (allowedFields: string[]) =>
    z.object({
        limit: z.number().int().positive({ message: "limit must be a positive number" })
            .max(100, { message: "limit must be less than or equal to 100" })
            .default(10),
        offset: z.number().min(0, { message: "offset must be a non-negative number" }).default(0),
        fields: z.array(z.string()).optional()
            .refine((arr) => arr === undefined || arr.every((f) => allowedFields.includes(f)), {
                message: `fields must be one of: ${allowedFields.join(", ")}`,
            })
            .transform((fields) => fields?.map((f) => sanitizeHtml(f))),
        search: z.string().optional().transform((val) => val === undefined ? val : sanitizeHtml(val)),
        sortField: z.string().optional()
            .refine((f) => f === undefined || allowedFields.includes(f), {
                message: `sortField must be one of: ${allowedFields.join(", ")}`,
            })
            .transform((val) => val === undefined ? undefined : sanitizeHtml(val)),
        sortOrder: z.enum(["asc", "desc"]).default("asc").optional(),
        countTotal: z.union([z.boolean(), z.string()]).optional()
            .transform((val) => {
                if (typeof val === "boolean") return val;
                if (typeof val !== "string") return false;
                return sanitizeHtml(val).toLowerCase() === "true";
            }),
    });

export type IncomingRequestValidationParams = z.infer<ReturnType<typeof incomingRequestValidationSchema>>;
