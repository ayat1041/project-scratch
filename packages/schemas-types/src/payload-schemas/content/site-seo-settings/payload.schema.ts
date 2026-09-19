import { z } from "zod";
import { appSiteSeoSettingsVersionsSchema } from "../../../tables/content/app_site_seo_settings_versions";

const robotsRuleSchema = z.object({
    userAgent: z.string().min(1).max(200),
    allow: z.array(z.string().max(500)).default([]),
    disallow: z.array(z.string().max(500)).default([]),
    crawlDelay: z.number().int().nonnegative().nullable().optional(),
});

export const RobotsConfigValidationSchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("structured"),
        rules: z.array(robotsRuleSchema).min(1, "At least one robots rule is required"),
    }),
    z.object({
        mode: z.literal("raw"),
        rawContent: z.string().min(1, "Raw robots.txt content is required"),
    }),
]);

const sitemapCustomUrlSchema = z.object({
    path: z.string().min(1).max(500),
    changeFrequency: z
        .enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"])
        .nullable()
        .optional(),
    priority: z.number().min(0).max(1).nullable().optional(),
});

export const SitemapConfigValidationSchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("structured"),
        customUrls: z.array(sitemapCustomUrlSchema).default([]),
    }),
    z.object({
        mode: z.literal("raw"),
        rawContent: z.string().min(1, "Raw sitemap XML content is required"),
    }),
]);

export const OrganizationJsonLdValidationSchema = z
    .object({
        name: z.string().max(255).nullable().optional(),
        logoUrl: z.string().max(1000).nullable().optional(),
        sameAs: z.array(z.string().max(500)).default([]),
    })
    .nullable()
    .optional();

export const SiteSeoSettingsDraftPayloadValidationSchema = z
    .object({
        titleTemplate: appSiteSeoSettingsVersionsSchema.shape.titleTemplate,
        metaDescription: appSiteSeoSettingsVersionsSchema.shape.metaDescription,
        metaKeywords: appSiteSeoSettingsVersionsSchema.shape.metaKeywords,
        canonicalBaseUrl: appSiteSeoSettingsVersionsSchema.shape.canonicalBaseUrl,

        ogTitle: appSiteSeoSettingsVersionsSchema.shape.ogTitle,
        ogDescription: appSiteSeoSettingsVersionsSchema.shape.ogDescription,
        ogImageUrl: appSiteSeoSettingsVersionsSchema.shape.ogImageUrl,
        ogType: appSiteSeoSettingsVersionsSchema.shape.ogType,
        twitterCard: appSiteSeoSettingsVersionsSchema.shape.twitterCard,
        twitterHandle: appSiteSeoSettingsVersionsSchema.shape.twitterHandle,
        faviconUrl: appSiteSeoSettingsVersionsSchema.shape.faviconUrl,

        googleSiteVerification: appSiteSeoSettingsVersionsSchema.shape.googleSiteVerification,
        bingSiteVerification: appSiteSeoSettingsVersionsSchema.shape.bingSiteVerification,
        googleAnalyticsId: appSiteSeoSettingsVersionsSchema.shape.googleAnalyticsId,

        organizationJsonLd: OrganizationJsonLdValidationSchema,

        robots: RobotsConfigValidationSchema,
        sitemap: SitemapConfigValidationSchema,
    })
    .strict();

export type SiteSeoSettingsDraftPayloadValidationSchemaType = z.infer<
    typeof SiteSeoSettingsDraftPayloadValidationSchema
>;
export type RobotsConfigValidationSchemaType = z.infer<typeof RobotsConfigValidationSchema>;
export type SitemapConfigValidationSchemaType = z.infer<typeof SitemapConfigValidationSchema>;
