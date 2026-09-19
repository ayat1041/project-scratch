import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import type { SiteSeoSettingsDraftPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/content/site-seo-settings/payload.schema';
import * as seoSettingsService from '../services';

export const handleSaveSiteSeoSettingsDraft = async (
  payload: SiteSeoSettingsDraftPayloadValidationSchemaType,
) => {
  try {
    const result = await seoSettingsService.saveDraftSiteSeoSettings(payload);
    toast.success('Draft saved successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to save draft');
    throw error;
  }
};

export const handlePublishSiteSeoSettings = async () => {
  try {
    const result = await seoSettingsService.publishSiteSeoSettings();
    toast.success('Site SEO settings published successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to publish SEO settings');
    throw error;
  }
};

export const handleRestoreSiteSeoSettingsVersion = async (versionId: string) => {
  try {
    const result = await seoSettingsService.restoreSiteSeoSettingsVersion(versionId);
    toast.success('Version restored into the current draft');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to restore version');
    throw error;
  }
};

export const handleListSiteSeoSettingsVersions = async (limit: number, offset: number) => {
  try {
    return await seoSettingsService.listSiteSeoSettingsVersions(limit, offset);
  } catch (error) {
    handleErrorToast(error, 'Failed to load version history');
    throw error;
  }
};
