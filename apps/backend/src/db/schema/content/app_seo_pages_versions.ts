import "module-alias/register";
import {
  boolean,
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
import appSeoPages from "@/db/schema/content/app_seo_pages";

const appSeoPagesVersions = pgTable(
  "app_seo_pages_versions",
  {
    id: uuid().primaryKey().defaultRandom(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => appSeoPages.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived

    title: varchar("title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),
    canonicalUrl: varchar("canonical_url", { length: 500 }),
    ogTitle: varchar("og_title", { length: 255 }),
    ogDescription: text("og_description"),
    ogImageUrl: varchar("og_image_url", { length: 1000 }),
    noindex: boolean("noindex").notNull().default(false),
    nofollow: boolean("nofollow").notNull().default(false),
    // { type, data: Record<string, unknown> } — see PageJsonLdValidationSchema
    jsonLd: jsonb("json_ld"),

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
    // At most one published version per page.
    onePublishedVersionPerPage: uniqueIndex(
      "idx_seo_pages_versions_one_published_per_page",
    )
      .on(table.pageId)
      .where(sql`${table.status} = 'published'`),
  }),
);

export default appSeoPagesVersions;
