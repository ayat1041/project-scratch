import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';
import { fetchWithCookiesServer } from '@repo/utilities/http/fetch-with-cookies-server';
import { createApiError } from '@repo/utilities/errors/error-parsing';
import type { SiteSeoSettingsDraftPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/content/site-seo-settings/payload.schema';
import type {
  SiteSeoSettingsVersionResponseType,
  SiteSeoSettingsVersionSummaryType,
} from '@repo/schemas-types/payload-schemas/content/site-seo-settings/response.schema';
import { SEO_SETTINGS_ENDPOINTS as E } from './api-constants';

export interface SeoSettingsDraftApiResponse {
  data: SiteSeoSettingsVersionResponseType | null;
  hasUnsavedDraft: boolean;
}

export interface SeoSettingsVersionsApiResponse {
  data: SiteSeoSettingsVersionSummaryType[];
  pagination: { limit: number; offset: number; total: number; currentCount: number };
}

// SSR read — called directly from Presenter.tsx
export async function getDraftSiteSeoSettings(): Promise<SeoSettingsDraftApiResponse> {
  const response = await fetchWithCookiesServer(E.DRAFT(), {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load SEO settings', response.status);
  }
  return { data: result.data, hasUnsavedDraft: result.hasUnsavedDraft };
}

export async function saveDraftSiteSeoSettings(
  payload: SiteSeoSettingsDraftPayloadValidationSchemaType,
): Promise<SiteSeoSettingsVersionResponseType> {
  const response = await fetchWithCookies(E.DRAFT(), {
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

export async function publishSiteSeoSettings(): Promise<SiteSeoSettingsVersionResponseType> {
  const response = await fetchWithCookies(E.PUBLISH(), { method: 'POST' });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to publish SEO settings', response.status);
  }
  return result.data;
}

export async function listSiteSeoSettingsVersions(
  limit: number,
  offset: number,
): Promise<SeoSettingsVersionsApiResponse> {
  const response = await fetchWithCookies(E.VERSIONS(limit, offset), { method: 'GET' });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load version history', response.status);
  }
  return { data: result.data, pagination: result.pagination };
}

export async function restoreSiteSeoSettingsVersion(
  versionId: string,
): Promise<SiteSeoSettingsVersionResponseType> {
  const response = await fetchWithCookies(E.RESTORE_VERSION(versionId), { method: 'POST' });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to restore version', response.status);
  }
  return result.data;
}
