import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import type { SeoPageDraftPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/content/seo-pages/payload.schema';
import * as seoPagesService from '../services';

export const handleCreateSeoPage = async (path: string) => {
  try {
    const result = await seoPagesService.createSeoPage(path);
    toast.success('Page created successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to create page');
    throw error;
  }
};

export const handleSaveSeoPageDraft = async (
  id: string,
  payload: SeoPageDraftPayloadValidationSchemaType,
) => {
  try {
    const result = await seoPagesService.saveSeoPageDraft(id, payload);
    toast.success('Draft saved successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to save draft');
    throw error;
  }
};

export const handlePublishSeoPage = async (id: string) => {
  try {
    const result = await seoPagesService.publishSeoPage(id);
    toast.success('Page published successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to publish page');
    throw error;
  }
};

export const handleDeleteSeoPage = async (id: string) => {
  try {
    const result = await seoPagesService.deleteSeoPage(id);
    toast.success('Page deleted successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to delete page');
    throw error;
  }
};
