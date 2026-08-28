import { Request, Response } from "express";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { AdminCreatePermissionPayloadValidationSchema as createPermissionSchema } from "@repo/schemas-types/payload-schemas/admin/permissions/payload.schema";
import { createError } from "@/middleware/error.middleware";
import {
  generateHateoasLinksForCollection,
  generateHateoasLinksForSingleRecord,
} from "@/utils/generate-hateoas-links.utils";
import { asyncHandler } from "@/utils/async-handler";
import {
  bulkDeletePermissionsService,
  createPermissionService,
  deleteSinglePermissionService,
  getSinglePermissionService,
  listAllPermissionsService,
  updateSinglePermissionService,
} from "@/modules/user-management/F6001-permissions/services/permission.service";

export const listAllPermissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const search = req.query.search
      ? String(req.query.search).trim()
      : undefined;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const sort = (req.query.sort as string) || "desc";

    if (limit < 0 || offset < 0) {
      throw createError.validation("Invalid limit or offset", {
        error: "Limit and offset must be non-negative integers",
        hint: "Ensure that limit and offset are valid non-negative integers.",
      });
    }

    const { permissions, total } = await listAllPermissionsService({
      search,
      limit,
      offset,
      sort,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}`;
    const _links = generateHateoasLinksForCollection({
      baseUrl,
      offset,
      limit,
      totalCount: total,
      search,
    });

    res.status(200).json({
      success: true,
      data: permissions,
      pagination: {
        offset,
        limit,
        total,
        currentCount: permissions.length,
      },
      _links,
    });
  },
);

export const getSinglePermissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      throw createError.validation("Permission ID is required", {
        error: "Permission ID is missing in the request parameters",
        hint: "Please provide a valid permission ID in the request.",
      });
    }

    const permissionData = await getSinglePermissionService(id);

    const _links = generateHateoasLinksForSingleRecord({
      baseUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}`,
      id: permissionData.permission.id,
    });

    res.status(200).json({
      success: true,
      data: permissionData,
      _links,
    });
  },
);

export const createPermissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const validation = validateZodSchema(createPermissionSchema)(req.body);
    const { name, description } = validation;

    const newPermission = await createPermissionService({
      name,
      description,
    });

    const _links = generateHateoasLinksForSingleRecord({
      baseUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}`,
      id: newPermission[0].id,
    });

    res.status(201).json({
      success: true,
      data: newPermission,
      message: "Permission created successfully",
      _links,
    });
  },
);

export const updateSinglePermissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      throw createError.validation("Permission ID is required", {
        error: "Permission ID is missing in the request parameters",
        hint: "Please provide a valid permission ID in the request.",
      });
    }

    const validation = validateZodSchema(createPermissionSchema)(req.body);
    const { name, description } = validation;

    const updatedPermission = await updateSinglePermissionService(id, {
      name,
      description,
    });

    const _links = generateHateoasLinksForSingleRecord({
      baseUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}`,
      id: updatedPermission[0].id,
    });

    res.status(200).json({
      success: true,
      data: updatedPermission,
      message: "Permission updated successfully",
      _links,
    });
  },
);

export const deleteSinglePermissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      throw createError.validation("Permission ID is required", {
        error: "Permission ID is missing in the request parameters",
        hint: "Please provide a valid permission ID in the request.",
      });
    }

    const deleted = await deleteSinglePermissionService(id);

    res.status(200).json({
      success: true,
      data: deleted,
      message: "Permission deleted successfully",
    });
  },
);

export const bulkDeletePermissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const rawIds = req.body?.ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      throw createError.validation("Permission IDs are required", {
        error: "The ids array is missing or empty in the request body",
        hint: "Please provide at least one permission ID to delete.",
      });
    }

    const ids = rawIds.map((rawId: unknown) => parseInt(String(rawId), 10));
    const deleted = await bulkDeletePermissionsService(ids);

    res.status(200).json({
      success: true,
      data: deleted,
      message: "Permissions deleted successfully",
    });
  },
);
