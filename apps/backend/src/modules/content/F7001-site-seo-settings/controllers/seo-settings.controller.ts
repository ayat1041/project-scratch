import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { createError } from "@/middleware/error.middleware";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { getUserIdFromAuth } from "@/modules/auth/auth.utils";
import { SiteSeoSettingsDraftPayloadValidationSchema } from "@repo/schemas-types/payload-schemas/content/site-seo-settings/payload.schema";
import {
  getDraftSiteSeoSettingsService,
  getPublishedSiteSeoSettingsService,
  listSiteSeoSettingsVersionsService,
  publishSiteSeoSettingsService,
  restoreSiteSeoSettingsVersionService,
  saveDraftSiteSeoSettingsService,
} from "@/modules/content/F7001-site-seo-settings/services/seo-settings.service";

const normalizeParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const getPublishedSiteSeoSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await getPublishedSiteSeoSettingsService();
    res.status(200).json({ success: true, data });
  },
);

export const getDraftSiteSeoSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getDraftSiteSeoSettingsService();
    res.status(200).json({ success: true, ...result });
  },
);

export const saveDraftSiteSeoSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = validateZodSchema(SiteSeoSettingsDraftPayloadValidationSchema)(
      req.body,
    );
    const userId = getUserIdFromAuth(res);

    const data = await saveDraftSiteSeoSettingsService(payload, userId);
    res.status(200).json({
      success: true,
      message: "Draft saved successfully",
      data,
    });
  },
);

export const publishSiteSeoSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const userId = getUserIdFromAuth(res);
    const data = await publishSiteSeoSettingsService(userId);
    res.status(200).json({
      success: true,
      message: "Site SEO settings published successfully",
      data,
    });
  },
);

export const listSiteSeoSettingsVersionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    if (limit < 0 || offset < 0) {
      throw createError.validation("Invalid limit or offset", {
        error: "Limit and offset must be non-negative integers.",
        hint: "Please provide valid limit and offset values.",
      });
    }

    const result = await listSiteSeoSettingsVersionsService({ limit, offset });
    res.status(200).json({ success: true, ...result });
  },
);

export const restoreSiteSeoSettingsVersionController = asyncHandler(
  async (req: Request, res: Response) => {
    const versionId = normalizeParam(req.params.id);
    if (!versionId) {
      throw createError.validation("Version ID is required", {
        error: "Version ID is missing in the request parameters",
        hint: "Please provide a valid version ID.",
      });
    }

    const userId = getUserIdFromAuth(res);
    const data = await restoreSiteSeoSettingsVersionService(versionId, userId);
    res.status(200).json({
      success: true,
      message: "Version restored into the current draft",
      data,
    });
  },
);
