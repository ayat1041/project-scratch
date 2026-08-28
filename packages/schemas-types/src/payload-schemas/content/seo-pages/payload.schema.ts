import { z } from "zod";
import { appSeoPagesSchema } from "../../../tables/content/app_seo_pages";
import { appSeoPagesVersionsSchema } from "../../../tables/content/app_seo_pages_versions";

export const PageJsonLdValidationSchema = z
    .object({
        type: z.string().min(1).max(100),
        data: z.record(z.string(), z.unknown()).default({}),
    })
    .nullable()
    .optional();

export const CreateSeoPagePayloadValidationSchema = z
    .object({
        path: appSeoPagesSchema.shape.path.refine((value) => value.startsWith("/"), {
            message: "Path must start with /",
        }),
    })
    .strict();
export type CreateSeoPagePayloadValidationSchemaType = z.infer<
    typeof CreateSeoPagePayloadValidationSchema
>;

export const SeoPageDraftPayloadValidationSchema = z
    .object({
        title: appSeoPagesVersionsSchema.shape.title,
        metaDescription: appSeoPagesVersionsSchema.shape.metaDescription,
        metaKeywords: appSeoPagesVersionsSchema.shape.metaKeywords,
        canonicalUrl: appSeoPagesVersionsSchema.shape.canonicalUrl,
        ogTitle: appSeoPagesVersionsSchema.shape.ogTitle,
        ogDescription: appSeoPagesVersionsSchema.shape.ogDescription,
        ogImageUrl: appSeoPagesVersionsSchema.shape.ogImageUrl,
        noindex: appSeoPagesVersionsSchema.shape.noindex,
        nofollow: appSeoPagesVersionsSchema.shape.nofollow,
        jsonLd: PageJsonLdValidationSchema,
    })
    .strict();
export type SeoPageDraftPayloadValidationSchemaType = z.infer<
    typeof SeoPageDraftPayloadValidationSchema
>;
