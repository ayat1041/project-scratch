import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';
import { fetchWithCookiesServer } from '@repo/utilities/http/fetch-with-cookies-server';
import { createApiError } from '@repo/utilities/errors/error-parsing';
import type { SeoPageDraftPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/content/seo-pages/payload.schema';
import type {
  SeoPageDetailResponseType,
  SeoPageListItemResponseType,
  SeoPageVersionResponseType,
} from '@repo/schemas-types/payload-schemas/content/seo-pages/response.schema';
import { SEO_PAGES_ENDPOINTS as E } from './api-constants';

export interface SeoPagesListApiResponse {
  data: SeoPageListItemResponseType[];
  pagination: { limit: number; offset: number; total: number; currentCount: number };
}

// SSR read — called directly from Presenter.tsx
export async function getSeoPagesList(
  limit: number,
  offset: number,
  search?: string,
): Promise<SeoPagesListApiResponse> {
  const response = await fetchWithCookiesServer(E.LIST(limit, offset, search), {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load SEO pages', response.status);
  }
  return { data: result.data, pagination: result.pagination };
}

// SSR read — called directly from the edit page's Presenter
export async function getSeoPageDetail(id: string): Promise<SeoPageDetailResponseType> {
  const response = await fetchWithCookiesServer(E.DETAIL(id), {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load SEO page', response.status);
  }
  return result.data;
}

export async function createSeoPage(path: string): Promise<{ id: string; path: string }> {
  const response = await fetchWithCookies(E.CREATE(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to create page', response.status);
  }
  return result.data;
}

export async function saveSeoPageDraft(
  id: string,
  payload: SeoPageDraftPayloadValidationSchemaType,
): Promise<SeoPageVersionResponseType> {
  const response = await fetchWithCookies(E.SAVE_DRAFT(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to save draft', response.status);
  }
  return result.data;
}

export async function publishSeoPage(id: string): Promise<SeoPageVersionResponseType> {
  const response = await fetchWithCookies(E.PUBLISH(id), { method: 'POST' });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to publish page', response.status);
  }
  return result.data;
}

export async function deleteSeoPage(id: string): Promise<{ id: string }> {
  const response = await fetchWithCookies(E.DELETE(id), { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to delete page', response.status);
  }
  return result.data;
}
