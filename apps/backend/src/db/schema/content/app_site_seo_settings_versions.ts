import "module-alias/register";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import appUsersTable from "@/db/schema/user-management/app_users";

const appSiteSeoSettingsVersions = pgTable(
  "app_site_seo_settings_versions",
  {
    id: uuid().primaryKey().defaultRandom(),
    versionNumber: integer("version_number").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived

    titleTemplate: varchar("title_template", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),
    canonicalBaseUrl: varchar("canonical_base_url", { length: 500 }),

    ogTitle: varchar("og_title", { length: 255 }),
    ogDescription: text("og_description"),
    ogImageUrl: varchar("og_image_url", { length: 1000 }),
    ogType: varchar("og_type", { length: 50 }).default("website"),
    twitterCard: varchar("twitter_card", { length: 50 }),
    twitterHandle: varchar("twitter_handle", { length: 100 }),
    faviconUrl: varchar("favicon_url", { length: 1000 }),

    googleSiteVerification: varchar("google_site_verification", {
      length: 255,
    }),
    bingSiteVerification: varchar("bing_site_verification", { length: 255 }),
    googleAnalyticsId: varchar("google_analytics_id", { length: 100 }),

    // { name, logoUrl, sameAs: string[] } — see OrganizationJsonLdValidationSchema
    organizationJsonLd: jsonb("organization_json_ld"),

    robotsMode: varchar("robots_mode", { length: 20 })
      .notNull()
      .default("structured"), // structured, raw
    // structured mode: [{ userAgent, allow: string[], disallow: string[], crawlDelay }]
    robotsRules: jsonb("robots_rules"),
    robotsRawContent: text("robots_raw_content"),

    sitemapMode: varchar("sitemap_mode", { length: 20 })
      .notNull()
      .default("structured"), // structured, raw
    // structured mode: [{ path, changeFrequency, priority }]
    sitemapCustomUrls: jsonb("sitemap_custom_urls"),
    sitemapRawContent: text("sitemap_raw_content"),

    createdBy: uuid("created_by").references(() => appUsersTable.id),
    publishedBy: uuid("published_by").references(() => appUsersTable.id),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // At most one row can be the published version at any time.
    onePublishedVersion: uniqueIndex("idx_site_seo_settings_one_published")
      .on(table.status)
      .where(sql`${table.status} = 'published'`),
  }),
);

export default appSiteSeoSettingsVersions;
