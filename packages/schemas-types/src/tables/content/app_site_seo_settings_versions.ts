import { z } from "zod";

export const appSiteSeoSettingsVersionsSchema = z.object({
    id: z.uuid(),
    versionNumber: z.number().int(),
    status: z.enum(["draft", "published", "archived"]),

    titleTemplate: z.string().max(255).nullable().optional(),
    metaDescription: z.string().nullable().optional(),
    metaKeywords: z.string().nullable().optional(),
    canonicalBaseUrl: z.string().max(500).nullable().optional(),

    ogTitle: z.string().max(255).nullable().optional(),
    ogDescription: z.string().nullable().optional(),
    ogImageUrl: z.string().max(1000).nullable().optional(),
    ogType: z.string().max(50).nullable().optional(),
    twitterCard: z.string().max(50).nullable().optional(),
    twitterHandle: z.string().max(100).nullable().optional(),
    faviconUrl: z.string().max(1000).nullable().optional(),

    googleSiteVerification: z.string().max(255).nullable().optional(),
    bingSiteVerification: z.string().max(255).nullable().optional(),
    googleAnalyticsId: z.string().max(100).nullable().optional(),

    organizationJsonLd: z.unknown().nullable().optional(),

    robotsMode: z.enum(["structured", "raw"]),
    robotsRules: z.unknown().nullable().optional(),
    robotsRawContent: z.string().nullable().optional(),

    sitemapMode: z.enum(["structured", "raw"]),
    sitemapCustomUrls: z.unknown().nullable().optional(),
    sitemapRawContent: z.string().nullable().optional(),

    createdBy: z.uuid().nullable().optional(),
    publishedBy: z.uuid().nullable().optional(),
    publishedAt: z.date().nullable().optional(),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
});

export type AppSiteSeoSettingsVersions = z.infer<typeof appSiteSeoSettingsVersionsSchema>;
