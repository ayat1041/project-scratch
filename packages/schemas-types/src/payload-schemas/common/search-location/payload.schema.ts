import { z } from "zod";
import { encodeHtmlSafe } from "@repo/utilities/security/dom-purify";
import { resourceIdValidationSchema } from "../payload.schema";

const searchLocationQuerySchema = z
    .string()
    .trim()
    .max(100, "Search query must not exceed 100 characters")
    .transform((value) => encodeHtmlSafe(value))
    .optional();

const searchLocationLimitSchema = z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(400, "Limit must not exceed 400")
    .optional();

const searchLocationIsVerifiedSchema = z
    .preprocess(
        (value) => (typeof value === "string" ? value.toLowerCase() : value),
        z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
    )
    .transform((value) => {
        if (value === undefined) return true;
        if (typeof value === "boolean") return value;
        return value === "true";
    });

export const commonSearchStatesSchema = z.object({
    countryId: resourceIdValidationSchema,
    query: searchLocationQuerySchema,
    q: searchLocationQuerySchema,
    limit: searchLocationLimitSchema,
    isVerified: searchLocationIsVerifiedSchema,
});
export type CommonSearchStatesPayload = z.infer<typeof commonSearchStatesSchema>;

export const commonSearchCitiesSchema = z.object({
    countryId: resourceIdValidationSchema,
    stateId: resourceIdValidationSchema.optional(),
    query: searchLocationQuerySchema,
    q: searchLocationQuerySchema,
    limit: searchLocationLimitSchema,
    isVerified: searchLocationIsVerifiedSchema,
});
export type CommonSearchCitiesPayload = z.infer<typeof commonSearchCitiesSchema>;
