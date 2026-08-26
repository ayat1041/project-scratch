import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { appLanguagesSchema } from "../../../tables/common-tables/app_languages";
import { resourceIdValidationSchema } from "../../common/payload.schema";

const nameField = appLanguagesSchema.shape.name
    .transform((name) => sanitizeHtml(name));

export const AdminCreateLanguagePayloadValidationSchema = z.object({
    name: nameField,
}).strict();
export type AdminCreateLanguagePayloadValidationSchemaType = z.infer<typeof AdminCreateLanguagePayloadValidationSchema>;

export const AdminLanguageIdParamSchema = z.object({
    id: resourceIdValidationSchema,
}).strict();
export type AdminLanguageIdParamSchemaType = z.infer<typeof AdminLanguageIdParamSchema>;
