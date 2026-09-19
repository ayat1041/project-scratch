// Requires: DATABASE_URL pointing to a running PostgreSQL instance (docker compose up)
import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { db, closeDbPool } from "@/db/db";
import { appSeoPagesTable, appUsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ERROR_TYPES, type ApiError } from "@/middleware/error.middleware";
import {
  createSeoPageService,
  deleteSeoPageService,
  getPublicSeoPageOverrideService,
  getSeoPageDetailService,
  listSeoPageVersionsService,
  listSeoPagesService,
  publishSeoPageService,
  saveSeoPageDraftService,
} from "../../services/seo-pages.service";
import type { SeoPageDraftPayloadValidationSchemaType } from "@repo/schemas-types/payload-schemas/content/seo-pages/payload.schema";

let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

let testUserId: string;
const createdPageIds: string[] = [];

const buildPayload = (title: string): SeoPageDraftPayloadValidationSchemaType => ({
  title,
  metaDescription: "A pricing page",
  metaKeywords: null,
  canonicalUrl: null,
  ogTitle: null,
  ogDescription: null,
  ogImageUrl: null,
  noindex: false,
  nofollow: false,
  jsonLd: null,
});

before(async () => {
  const [user] = await db
    .insert(appUsersTable)
    .values({
      email: `seo-pages-${uid()}@example.test`,
      password: "hashed",
      userName: `seo-pages-${uid()}`,
      providerName: "email",
    })
    .returning({ id: appUsersTable.id });

  testUserId = user!.id;
});

after(async () => {
  for (const pageId of createdPageIds) {
    await db.delete(appSeoPagesTable).where(eq(appSeoPagesTable.id, pageId));
  }
  await db.delete(appUsersTable).where(eq(appUsersTable.id, testUserId));
  await closeDbPool();
});

test("SEO page lifecycle - create, save draft, publish, list, public read, delete", async () => {
  const path = `/pricing-${uid()}`;
  const page = await createSeoPageService(path);
  createdPageIds.push(page.id);

  await assert.rejects(
    () => createSeoPageService(path),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.CONFLICT);
      return true;
    },
  );

  const noOverrideYet = await getPublicSeoPageOverrideService(path);
  assert.equal(noOverrideYet, null);

  const draft = await saveSeoPageDraftService(page.id, buildPayload("Pricing"), testUserId);
  assert.equal(draft.status, "draft");
  assert.equal(draft.versionNumber, 1);

  const detailBeforePublish = await getSeoPageDetailService(page.id);
  assert.equal(detailBeforePublish.draft?.id, draft.id);
  assert.equal(detailBeforePublish.published, null);

  const published = await publishSeoPageService(page.id, testUserId);
  assert.equal(published.status, "published");
  assert.equal(published.id, draft.id);

  const publicOverride = await getPublicSeoPageOverrideService(path);
  assert.equal(publicOverride?.title, "Pricing");

  const secondDraft = await saveSeoPageDraftService(page.id, buildPayload("Pricing v2"), testUserId);
  assert.notEqual(secondDraft.id, published.id, "editing after publish creates a new version");
  assert.equal(secondDraft.versionNumber, 2);

  const { data: pageList } = await listSeoPagesService({ limit: 50, offset: 0, search: path });
  assert.equal(pageList.some((item) => item.id === page.id && item.latestStatus === "draft"), true);

  const versions = await listSeoPageVersionsService(page.id);
  assert.equal(versions.length, 2);

  await deleteSeoPageService(page.id);
  createdPageIds.splice(createdPageIds.indexOf(page.id), 1);

  await assert.rejects(
    () => getSeoPageDetailService(page.id),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.NOT_FOUND);
      return true;
    },
  );
});

test("publishSeoPageService - throws BAD_REQUEST when there is no draft for the page", async () => {
  const path = `/no-draft-${uid()}`;
  const page = await createSeoPageService(path);
  createdPageIds.push(page.id);

  await assert.rejects(
    () => publishSeoPageService(page.id, testUserId),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.BAD_REQUEST);
      return true;
    },
  );
});
