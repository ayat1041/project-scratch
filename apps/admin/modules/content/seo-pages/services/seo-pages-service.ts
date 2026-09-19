import { wrapZodError } from '@repo/utilities/errors/error-parsing';
import { SeoPageDraftPayloadValidationSchema } from '@repo/schemas-types/payload-schemas/content/seo-pages/payload.schema';
import type { SeoPageDraftPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/content/seo-pages/payload.schema';
import * as seoPagesApi from '../api/seo-pages-api';

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const getSeoPagesList = async (
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) => {
  const params = await searchParams;
  const limit = Number(first(params.limit)) || 10;
  const offset = Number(first(params.offset)) || 0;
  const search = first(params.search);

  return seoPagesApi.getSeoPagesList(limit, offset, search);
};

export const getSeoPageDetail = async (id: string) => {
  return seoPagesApi.getSeoPageDetail(id);
};

export const createSeoPage = async (path: string) => {
  return seoPagesApi.createSeoPage(path);
};

export const saveSeoPageDraft = async (
  id: string,
  payload: SeoPageDraftPayloadValidationSchemaType,
) => {
  try {
    const validated = SeoPageDraftPayloadValidationSchema.parse(payload);
    return await seoPagesApi.saveSeoPageDraft(id, validated);
  } catch (error) {
    wrapZodError(error);
  }
};

export const publishSeoPage = async (id: string) => {
  return seoPagesApi.publishSeoPage(id);
};

export const deleteSeoPage = async (id: string) => {
  return seoPagesApi.deleteSeoPage(id);
};
