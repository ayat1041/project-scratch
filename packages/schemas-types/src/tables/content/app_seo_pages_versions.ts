import { z } from "zod";

export const appSeoPagesVersionsSchema = z.object({
    id: z.uuid(),
    pageId: z.uuid(),
    versionNumber: z.number().int(),
    status: z.enum(["draft", "published", "archived"]),

    title: z.string().max(255).nullable().optional(),
    metaDescription: z.string().nullable().optional(),
    metaKeywords: z.string().nullable().optional(),
    canonicalUrl: z.string().max(500).nullable().optional(),
    ogTitle: z.string().max(255).nullable().optional(),
    ogDescription: z.string().nullable().optional(),
    ogImageUrl: z.string().max(1000).nullable().optional(),
    noindex: z.boolean(),
    nofollow: z.boolean(),
    jsonLd: z.unknown().nullable().optional(),

    createdBy: z.uuid().nullable().optional(),
    publishedBy: z.uuid().nullable().optional(),
    publishedAt: z.date().nullable().optional(),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
});

export type AppSeoPagesVersions = z.infer<typeof appSeoPagesVersionsSchema>;
