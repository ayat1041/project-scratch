import { createError } from "@/middleware/error.middleware";
import type { SeoPageDraftPayloadValidationSchemaType } from "@repo/schemas-types/payload-schemas/content/seo-pages/payload.schema";
import type {
  SeoPageDetailResponseType,
  SeoPageListItemResponseType,
  SeoPageVersionResponseType,
} from "@repo/schemas-types/payload-schemas/content/seo-pages/response.schema";
import * as seoPagesRepository from "@/modules/content/F7002-seo-pages/repositories/seo-pages.repository";

type SeoPageVersionRow = NonNullable<
  Awaited<ReturnType<typeof seoPagesRepository.findVersionById>>
>;

const toVersionResponse = (row: SeoPageVersionRow): SeoPageVersionResponseType => ({
  id: row.id,
  pageId: row.pageId,
  versionNumber: row.versionNumber,
  status: row.status as "draft" | "published" | "archived",
  title: row.title,
  metaDescription: row.metaDescription,
  metaKeywords: row.metaKeywords,
  canonicalUrl: row.canonicalUrl,
  ogTitle: row.ogTitle,
  ogDescription: row.ogDescription,
  ogImageUrl: row.ogImageUrl,
  noindex: row.noindex,
  nofollow: row.nofollow,
  jsonLd: (row.jsonLd as SeoPageVersionResponseType["jsonLd"]) ?? null,
  publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  createdAt: row.createdAt!.toISOString(),
  updatedAt: row.updatedAt!.toISOString(),
});

const fromPayload = (payload: SeoPageDraftPayloadValidationSchemaType) => ({
  title: payload.title ?? null,
  metaDescription: payload.metaDescription ?? null,
  metaKeywords: payload.metaKeywords ?? null,
  canonicalUrl: payload.canonicalUrl ?? null,
  ogTitle: payload.ogTitle ?? null,
  ogDescription: payload.ogDescription ?? null,
  ogImageUrl: payload.ogImageUrl ?? null,
  noindex: payload.noindex,
  nofollow: payload.nofollow,
  jsonLd: payload.jsonLd ?? null,
});

export const listSeoPagesService = async ({
  limit,
  offset,
  search,
}: {
  limit: number;
  offset: number;
  search?: string;
}) => {
  const { pages, versions, total } = await seoPagesRepository.listPages({ limit, offset, search });

  const data: SeoPageListItemResponseType[] = pages.map((page) => {
    const pageVersions = versions.filter((version) => version.pageId === page.id);
    const published = pageVersions.find((version) => version.status === "published");
    const latest = pageVersions[0];

    return {
      id: page.id,
      path: page.path,
      latestStatus: (latest?.status as "draft" | "published" | "archived" | undefined) ?? "none",
      publishedTitle: published?.title ?? null,
      updatedAt: page.updatedAt!.toISOString(),
    };
  });

  return { data, pagination: { limit, offset, total, currentCount: data.length } };
};

export const getSeoPageDetailService = async (pageId: string): Promise<SeoPageDetailResponseType> => {
  const page = await seoPagesRepository.findPageById(pageId);
  if (!page) {
    throw createError.notFound("SEO page not found", {
      error: `No SEO page found with ID ${pageId}`,
      hint: "Please check the page ID and try again.",
    });
  }

  const [draft, published] = await Promise.all([
    seoPagesRepository.findLatestDraftForPage(pageId),
    seoPagesRepository.findPublishedForPage(pageId),
  ]);

  return {
    id: page.id,
    path: page.path,
    createdAt: page.createdAt!.toISOString(),
    updatedAt: page.updatedAt!.toISOString(),
    draft: draft ? toVersionResponse(draft) : null,
    published: published ? toVersionResponse(published) : null,
  };
};

export const createSeoPageService = async (path: string) => {
  const existing = await seoPagesRepository.findPageByPath(path);
  if (existing) {
    throw createError.conflict("A page override already exists for this path", {
      error: `Path ${path} is already registered`,
      hint: "Edit the existing page instead of creating a new one.",
    });
  }

  const page = await seoPagesRepository.insertPage(path);
  return { id: page.id, path: page.path, createdAt: page.createdAt!.toISOString() };
};

export const saveSeoPageDraftService = async (
  pageId: string,
  payload: SeoPageDraftPayloadValidationSchemaType,
  userId: string,
): Promise<SeoPageVersionResponseType> => {
  const page = await seoPagesRepository.findPageById(pageId);
  if (!page) {
    throw createError.notFound("SEO page not found", {
      error: `No SEO page found with ID ${pageId}`,
      hint: "Please check the page ID and try again.",
    });
  }

  const values = fromPayload(payload);
  const existingDraft = await seoPagesRepository.findLatestDraftForPage(pageId);

  const row = existingDraft
    ? await seoPagesRepository.updateDraftVersion(existingDraft.id, values)
    : await seoPagesRepository.insertDraftVersionForPage(pageId, values, userId);

  return toVersionResponse(row);
};

export const publishSeoPageService = async (
  pageId: string,
  userId: string,
): Promise<SeoPageVersionResponseType> => {
  const draft = await seoPagesRepository.findLatestDraftForPage(pageId);
  if (!draft) {
    throw createError.badRequest("There is no draft to publish", {
      error: "No draft version exists for this page",
      hint: "Save changes as a draft before publishing.",
    });
  }

  const row = await seoPagesRepository.publishDraftVersionForPage(pageId, draft.id, userId);
  return toVersionResponse(row);
};

export const deleteSeoPageService = async (pageId: string) => {
  const page = await seoPagesRepository.findPageById(pageId);
  if (!page) {
    throw createError.notFound("SEO page not found", {
      error: `No SEO page found with ID ${pageId}`,
      hint: "Please check the page ID and try again.",
    });
  }

  await seoPagesRepository.deletePage(pageId);
  return { id: pageId };
};

export const listSeoPageVersionsService = async (pageId: string) => {
  const page = await seoPagesRepository.findPageById(pageId);
  if (!page) {
    throw createError.notFound("SEO page not found", {
      error: `No SEO page found with ID ${pageId}`,
      hint: "Please check the page ID and try again.",
    });
  }

  const versions = await seoPagesRepository.findVersionsForPage(pageId);
  return versions.map((row) => ({
    id: row.id,
    versionNumber: row.versionNumber,
    status: row.status as "draft" | "published" | "archived",
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt!.toISOString(),
  }));
};

export const getPublicSeoPageOverrideService = async (
  path: string,
): Promise<SeoPageVersionResponseType | null> => {
  const published = await seoPagesRepository.findPublishedByPath(path);
  return published ? toVersionResponse(published) : null;
};
