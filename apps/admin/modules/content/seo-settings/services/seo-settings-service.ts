import { wrapZodError } from '@repo/utilities/errors/error-parsing';
import { SiteSeoSettingsDraftPayloadValidationSchema } from '@repo/schemas-types/payload-schemas/content/site-seo-settings/payload.schema';
import type { SiteSeoSettingsDraftPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/content/site-seo-settings/payload.schema';
import * as seoSettingsApi from '../api/seo-settings-api';

export const getDraftSiteSeoSettings = async () => {
  return seoSettingsApi.getDraftSiteSeoSettings();
};

export const saveDraftSiteSeoSettings = async (
  payload: SiteSeoSettingsDraftPayloadValidationSchemaType,
) => {
  try {
    const validated = SiteSeoSettingsDraftPayloadValidationSchema.parse(payload);
    return await seoSettingsApi.saveDraftSiteSeoSettings(validated);
  } catch (error) {
    wrapZodError(error);
  }
};

export const publishSiteSeoSettings = async () => {
  return seoSettingsApi.publishSiteSeoSettings();
};

export const listSiteSeoSettingsVersions = async (limit: number, offset: number) => {
  return seoSettingsApi.listSiteSeoSettingsVersions(limit, offset);
};

export const restoreSiteSeoSettingsVersion = async (versionId: string) => {
  return seoSettingsApi.restoreSiteSeoSettingsVersion(versionId);
};
