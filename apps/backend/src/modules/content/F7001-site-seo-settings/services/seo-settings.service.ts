import { createError } from "@/middleware/error.middleware";
import type { SiteSeoSettingsDraftPayloadValidationSchemaType } from "@repo/schemas-types/payload-schemas/content/site-seo-settings/payload.schema";
import type { SiteSeoSettingsVersionResponseType } from "@repo/schemas-types/payload-schemas/content/site-seo-settings/response.schema";
import * as seoSettingsRepository from "@/modules/content/F7001-site-seo-settings/repositories/seo-settings.repository";

type SiteSeoSettingsVersionRow = Awaited<
  ReturnType<typeof seoSettingsRepository.findVersionById>
>;

const toResponse = (
  row: NonNullable<SiteSeoSettingsVersionRow>,
): SiteSeoSettingsVersionResponseType => ({
  id: row.id,
  versionNumber: row.versionNumber,
  status: row.status as "draft" | "published" | "archived",
  titleTemplate: row.titleTemplate,
  metaDescription: row.metaDescription,
  metaKeywords: row.metaKeywords,
  canonicalBaseUrl: row.canonicalBaseUrl,
  ogTitle: row.ogTitle,
  ogDescription: row.ogDescription,
  ogImageUrl: row.ogImageUrl,
  ogType: row.ogType,
  twitterCard: row.twitterCard,
  twitterHandle: row.twitterHandle,
  faviconUrl: row.faviconUrl,
  googleSiteVerification: row.googleSiteVerification,
  bingSiteVerification: row.bingSiteVerification,
  googleAnalyticsId: row.googleAnalyticsId,
  organizationJsonLd:
    (row.organizationJsonLd as SiteSeoSettingsVersionResponseType["organizationJsonLd"]) ??
    null,
  robots:
    row.robotsMode === "raw"
      ? { mode: "raw", rawContent: row.robotsRawContent ?? "" }
      : {
          mode: "structured",
          rules:
            (row.robotsRules as SiteSeoSettingsVersionResponseType["robots"] extends {
              rules: infer R;
            }
              ? R
              : never) ?? [],
        },
  sitemap:
    row.sitemapMode === "raw"
      ? { mode: "raw", rawContent: row.sitemapRawContent ?? "" }
      : {
          mode: "structured",
          customUrls:
            (row.sitemapCustomUrls as SiteSeoSettingsVersionResponseType["sitemap"] extends {
              customUrls: infer C;
            }
              ? C
              : never) ?? [],
        },
  publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  createdAt: row.createdAt!.toISOString(),
  updatedAt: row.updatedAt!.toISOString(),
});

const fromPayload = (payload: SiteSeoSettingsDraftPayloadValidationSchemaType) => ({
  titleTemplate: payload.titleTemplate ?? null,
  metaDescription: payload.metaDescription ?? null,
  metaKeywords: payload.metaKeywords ?? null,
  canonicalBaseUrl: payload.canonicalBaseUrl ?? null,
  ogTitle: payload.ogTitle ?? null,
  ogDescription: payload.ogDescription ?? null,
  ogImageUrl: payload.ogImageUrl ?? null,
  ogType: payload.ogType ?? null,
  twitterCard: payload.twitterCard ?? null,
  twitterHandle: payload.twitterHandle ?? null,
  faviconUrl: payload.faviconUrl ?? null,
  googleSiteVerification: payload.googleSiteVerification ?? null,
  bingSiteVerification: payload.bingSiteVerification ?? null,
  googleAnalyticsId: payload.googleAnalyticsId ?? null,
  organizationJsonLd: payload.organizationJsonLd ?? null,
  robotsMode: payload.robots.mode,
  robotsRules: payload.robots.mode === "structured" ? payload.robots.rules : null,
  robotsRawContent: payload.robots.mode === "raw" ? payload.robots.rawContent : null,
  sitemapMode: payload.sitemap.mode,
  sitemapCustomUrls:
    payload.sitemap.mode === "structured" ? payload.sitemap.customUrls : null,
  sitemapRawContent: payload.sitemap.mode === "raw" ? payload.sitemap.rawContent : null,
});

export const getPublishedSiteSeoSettingsService = async (): Promise<SiteSeoSettingsVersionResponseType> => {
  const row = await seoSettingsRepository.findPublishedVersion();
  if (!row) {
    throw createError.notFound("Site SEO settings have not been published yet", {
      error: "No published version exists",
      hint: "Publish a draft from the admin panel first.",
    });
  }
  return toResponse(row);
};

export const getDraftSiteSeoSettingsService = async (): Promise<{
  data: SiteSeoSettingsVersionResponseType | null;
  hasUnsavedDraft: boolean;
}> => {
  const draft = await seoSettingsRepository.findLatestDraftVersion();
  if (draft) {
    return { data: toResponse(draft), hasUnsavedDraft: true };
  }

  const published = await seoSettingsRepository.findPublishedVersion();
  if (published) {
    return { data: toResponse(published), hasUnsavedDraft: false };
  }

  return { data: null, hasUnsavedDraft: false };
};

export const saveDraftSiteSeoSettingsService = async (
  payload: SiteSeoSettingsDraftPayloadValidationSchemaType,
  userId: string,
): Promise<SiteSeoSettingsVersionResponseType> => {
  const values = fromPayload(payload);
  const existingDraft = await seoSettingsRepository.findLatestDraftVersion();

  const row = existingDraft
    ? await seoSettingsRepository.updateDraftVersion(existingDraft.id, values)
    : await seoSettingsRepository.insertDraftVersion(values, userId);

  return toResponse(row);
};

export const publishSiteSeoSettingsService = async (
  userId: string,
): Promise<SiteSeoSettingsVersionResponseType> => {
  const draft = await seoSettingsRepository.findLatestDraftVersion();
  if (!draft) {
    throw createError.badRequest("There is no draft to publish", {
      error: "No draft version exists",
      hint: "Save changes as a draft before publishing.",
    });
  }

  const row = await seoSettingsRepository.publishDraftVersion(draft.id, userId);
  return toResponse(row);
};

export const listSiteSeoSettingsVersionsService = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  const { rows, total } = await seoSettingsRepository.listVersions({ limit, offset });
  return {
    data: rows.map((row) => ({
      id: row.id,
      versionNumber: row.versionNumber,
      status: row.status as "draft" | "published" | "archived",
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      createdAt: row.createdAt!.toISOString(),
    })),
    pagination: { limit, offset, total, currentCount: rows.length },
  };
};

export const restoreSiteSeoSettingsVersionService = async (
  versionId: string,
  userId: string,
): Promise<SiteSeoSettingsVersionResponseType> => {
  const sourceVersion = await seoSettingsRepository.findVersionById(versionId);
  if (!sourceVersion) {
    throw createError.notFound("Version not found", {
      error: `No version found with ID ${versionId}`,
      hint: "Please check the version ID and try again.",
    });
  }

  const values = {
    titleTemplate: sourceVersion.titleTemplate,
    metaDescription: sourceVersion.metaDescription,
    metaKeywords: sourceVersion.metaKeywords,
    canonicalBaseUrl: sourceVersion.canonicalBaseUrl,
    ogTitle: sourceVersion.ogTitle,
    ogDescription: sourceVersion.ogDescription,
    ogImageUrl: sourceVersion.ogImageUrl,
    ogType: sourceVersion.ogType,
    twitterCard: sourceVersion.twitterCard,
    twitterHandle: sourceVersion.twitterHandle,
    faviconUrl: sourceVersion.faviconUrl,
    googleSiteVerification: sourceVersion.googleSiteVerification,
    bingSiteVerification: sourceVersion.bingSiteVerification,
    googleAnalyticsId: sourceVersion.googleAnalyticsId,
    organizationJsonLd: sourceVersion.organizationJsonLd,
    robotsMode: sourceVersion.robotsMode,
    robotsRules: sourceVersion.robotsRules,
    robotsRawContent: sourceVersion.robotsRawContent,
    sitemapMode: sourceVersion.sitemapMode,
    sitemapCustomUrls: sourceVersion.sitemapCustomUrls,
    sitemapRawContent: sourceVersion.sitemapRawContent,
  };

  const existingDraft = await seoSettingsRepository.findLatestDraftVersion();
  const row = existingDraft
    ? await seoSettingsRepository.updateDraftVersion(existingDraft.id, values)
    : await seoSettingsRepository.insertDraftVersion(values, userId);

  return toResponse(row);
};
