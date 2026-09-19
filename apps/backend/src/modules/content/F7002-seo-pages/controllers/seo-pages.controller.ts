import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { createError } from "@/middleware/error.middleware";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { getUserIdFromAuth } from "@/modules/auth/auth.utils";
import {
  CreateSeoPagePayloadValidationSchema,
  SeoPageDraftPayloadValidationSchema,
} from "@repo/schemas-types/payload-schemas/content/seo-pages/payload.schema";
import {
  createSeoPageService,
  deleteSeoPageService,
  getPublicSeoPageOverrideService,
  getSeoPageDetailService,
  listSeoPageVersionsService,
  listSeoPagesService,
  publishSeoPageService,
  saveSeoPageDraftService,
} from "@/modules/content/F7002-seo-pages/services/seo-pages.service";

const normalizeParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const requirePageId = (req: Request): string => {
  const id = normalizeParam(req.params.id);
  if (!id) {
    throw createError.validation("Page ID is required", {
      error: "Page ID is missing in the request parameters",
      hint: "Please provide a valid page ID.",
    });
  }
  return id;
};

export const listSeoPagesController = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const offset = parseInt(req.query.offset as string, 10) || 0;
  const search = req.query.search ? String(req.query.search).trim() : undefined;

  if (limit < 0 || offset < 0) {
    throw createError.validation("Invalid limit or offset", {
      error: "Limit and offset must be non-negative integers.",
      hint: "Please provide valid limit and offset values.",
    });
  }

  const result = await listSeoPagesService({ limit, offset, search });
  res.status(200).json({ success: true, ...result });
});

export const getSeoPageController = asyncHandler(async (req: Request, res: Response) => {
  const id = requirePageId(req);
  const data = await getSeoPageDetailService(id);
  res.status(200).json({ success: true, data });
});

export const createSeoPageController = asyncHandler(async (req: Request, res: Response) => {
  const { path } = validateZodSchema(CreateSeoPagePayloadValidationSchema)(req.body);
  const data = await createSeoPageService(path);
  res.status(201).json({ success: true, message: "Page created successfully", data });
});

export const saveSeoPageDraftController = asyncHandler(async (req: Request, res: Response) => {
  const id = requirePageId(req);
  const payload = validateZodSchema(SeoPageDraftPayloadValidationSchema)(req.body);
  const userId = getUserIdFromAuth(res);

  const data = await saveSeoPageDraftService(id, payload, userId);
  res.status(200).json({ success: true, message: "Draft saved successfully", data });
});

export const publishSeoPageController = asyncHandler(async (req: Request, res: Response) => {
  const id = requirePageId(req);
  const userId = getUserIdFromAuth(res);

  const data = await publishSeoPageService(id, userId);
  res.status(200).json({ success: true, message: "Page published successfully", data });
});

export const deleteSeoPageController = asyncHandler(async (req: Request, res: Response) => {
  const id = requirePageId(req);
  const data = await deleteSeoPageService(id);
  res.status(200).json({ success: true, message: "Page deleted successfully", data });
});

export const listSeoPageVersionsController = asyncHandler(async (req: Request, res: Response) => {
  const id = requirePageId(req);
  const data = await listSeoPageVersionsService(id);
  res.status(200).json({ success: true, data });
});

export const getPublicSeoPageOverrideController = asyncHandler(async (req: Request, res: Response) => {
  const path = req.query.path ? String(req.query.path) : undefined;
  if (!path) {
    throw createError.validation("Query parameter 'path' is required", {
      error: "Missing path query parameter",
      hint: "Provide the page path to look up, e.g. ?path=/pricing",
    });
  }

  const data = await getPublicSeoPageOverrideService(path);
  res.status(200).json({ success: true, data });
});
