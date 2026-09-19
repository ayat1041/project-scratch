// Requires: DATABASE_URL pointing to a running PostgreSQL instance (docker compose up)
import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { db, closeDbPool } from "@/db/db";
import { appSiteSeoSettingsVersionsTable, appUsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ERROR_TYPES, type ApiError } from "@/middleware/error.middleware";
import {
  getPublishedSiteSeoSettingsService,
  listSiteSeoSettingsVersionsService,
  publishSiteSeoSettingsService,
  restoreSiteSeoSettingsVersionService,
  saveDraftSiteSeoSettingsService,
} from "../../services/seo-settings.service";
import type { SiteSeoSettingsDraftPayloadValidationSchemaType } from "@repo/schemas-types/payload-schemas/content/site-seo-settings/payload.schema";

let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

let testUserId: string;

const buildPayload = (
  titleTemplate: string,
): SiteSeoSettingsDraftPayloadValidationSchemaType => ({
  titleTemplate,
  metaDescription: "A starter template site",
  metaKeywords: null,
  canonicalBaseUrl: "https://example.test",
  ogTitle: null,
  ogDescription: null,
  ogImageUrl: null,
  ogType: "website",
  twitterCard: null,
  twitterHandle: null,
  faviconUrl: null,
  googleSiteVerification: null,
  bingSiteVerification: null,
  googleAnalyticsId: null,
  organizationJsonLd: null,
  robots: { mode: "structured", rules: [{ userAgent: "*", allow: [], disallow: ["/admin"] }] },
  sitemap: { mode: "structured", customUrls: [] },
});

before(async () => {
  const [user] = await db
    .insert(appUsersTable)
    .values({
      email: `seo-settings-${uid()}@example.test`,
      password: "hashed",
      userName: `seo-settings-${uid()}`,
      providerName: "email",
    })
    .returning({ id: appUsersTable.id });

  testUserId = user!.id;
});

after(async () => {
  await db
    .delete(appSiteSeoSettingsVersionsTable)
    .where(eq(appSiteSeoSettingsVersionsTable.createdBy, testUserId));
  await db.delete(appUsersTable).where(eq(appUsersTable.id, testUserId));
  await closeDbPool();
});

test("site SEO settings lifecycle - save draft, publish, restore, list", async () => {
  const draft = await saveDraftSiteSeoSettingsService(buildPayload("v1 | Starter"), testUserId);
  assert.equal(draft.status, "draft");
  assert.equal(draft.titleTemplate, "v1 | Starter");

  const updatedDraft = await saveDraftSiteSeoSettingsService(buildPayload("v1 updated | Starter"), testUserId);
  assert.equal(updatedDraft.id, draft.id, "saving again should update the same draft row, not insert a new one");
  assert.equal(updatedDraft.titleTemplate, "v1 updated | Starter");

  const published = await publishSiteSeoSettingsService(testUserId);
  assert.equal(published.status, "published");
  assert.equal(published.id, draft.id);

  const publishedFetch = await getPublishedSiteSeoSettingsService();
  assert.equal(publishedFetch.titleTemplate, "v1 updated | Starter");

  const secondDraft = await saveDraftSiteSeoSettingsService(buildPayload("v2 | Starter"), testUserId);
  assert.notEqual(secondDraft.id, published.id, "a new draft is a new version row");
  assert.equal(secondDraft.versionNumber, published.versionNumber + 1);

  await publishSiteSeoSettingsService(testUserId);

  const versionHistory = await listSiteSeoSettingsVersionsService({ limit: 10, offset: 0 });
  const historyIds = versionHistory.data.map((version) => version.id);
  assert.equal(historyIds.includes(draft.id), true);
  assert.equal(historyIds.includes(secondDraft.id), true);
  const archivedEntry = versionHistory.data.find((version) => version.id === draft.id);
  assert.equal(archivedEntry?.status, "archived");

  const restoredDraft = await restoreSiteSeoSettingsVersionService(draft.id, testUserId);
  assert.equal(restoredDraft.status, "draft");
  assert.equal(restoredDraft.titleTemplate, "v1 updated | Starter");
});

test("publishSiteSeoSettingsService - throws BAD_REQUEST when there is no draft", async () => {
  // Publish immediately after a fresh publish leaves no pending draft behind.
  await saveDraftSiteSeoSettingsService(buildPayload("no-draft-check"), testUserId);
  await publishSiteSeoSettingsService(testUserId);

  await assert.rejects(
    () => publishSiteSeoSettingsService(testUserId),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.BAD_REQUEST);
      return true;
    },
  );
});
