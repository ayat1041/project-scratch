import { Request, Response } from "express";
import { createError } from "@/middleware/error.middleware";
import {
  generateHateoasLinksForCollection,
  generateHateoasLinksForSingleRecord,
} from "@/utils/generate-hateoas-links.utils";
import { AdminCreateRolePayloadValidationSchema as createRoleSchema } from "@repo/schemas-types/payload-schemas/admin/roles/payload.schema";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { asyncHandler } from "@/utils/async-handler";
import { getUserIdFromAuth } from "@/modules/auth/auth.utils";
import {
  createRoleService,
  deleteSingleRoleService,
  getSingleRoleService,
  listAllRolesService,
  updateSingleRoleService,
} from "@/modules/user-management/F6002-roles/services/role.service";

export const listAllRolesController = asyncHandler(
  async (req: Request, res: Response) => {
    const search = req.query.search
      ? String(req.query.search).trim()
      : undefined;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const sort = (req.query.sort as string) || "desc";

    if (limit < 0 || offset < 0) {
      throw createError.validation("Invalid limit or offset", {
        error: "Limit and offset must be non-negative integers.",
        hint: "Please provide valid limit and offset values.",
      });
    }

    const { results, total } = await listAllRolesService({
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
      data: results,
      pagination: {
        offset,
        limit,
        total,
        currentCount: results.length,
      },
      _links,
    });
  },
);

export const getSingleRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      throw createError.validation("Role ID is required", {
        error: "Role ID is missing in the request parameters",
        hint: "Please provide a valid role ID in the request.",
      });
    }

    const roleData = await getSingleRoleService(id);

    const _links = generateHateoasLinksForSingleRecord({
      baseUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}`,
      id: roleData.role.id,
    });

    res.status(200).json({
      success: true,
      data: roleData,
      _links,
    });
  },
);

export const createRolesController = asyncHandler(
  async (req: Request, res: Response) => {
    const validation = validateZodSchema(createRoleSchema)(req.body);
    const { name, description, permissions } = validation;
    const actingUserId = getUserIdFromAuth(res);

    const newRole = await createRoleService(
      { name, description, permissions },
      actingUserId,
    );

    const _links = generateHateoasLinksForSingleRecord({
      baseUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}`,
      id: newRole[0].id,
    });

    res.status(201).json({
      success: true,
      data: newRole,
      message: "Role created successfully",
      _links,
    });
  },
);

export const updateSingleRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      throw createError.validation("Role ID is required", {
        error: "Role ID is missing in the request parameters",
        hint: "Please provide a valid role ID in the request.",
      });
    }

    const validation = validateZodSchema(createRoleSchema)(req.body);
    const { name, description, permissions } = validation;
    const actingUserId = getUserIdFromAuth(res);

    const updatedRole = await updateSingleRoleService(
      id,
      { name, description, permissions },
      actingUserId,
    );

    const _links = generateHateoasLinksForSingleRecord({
      baseUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}`,
      id: updatedRole[0].id,
    });

    res.status(200).json({
      success: true,
      data: updatedRole,
      message: "Role updated successfully",
      _links,
    });
  },
);

export const deleteSingleRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      throw createError.validation("Role ID is required", {
        error: "Role ID is missing in the request parameters",
        hint: "Please provide a valid role ID in the request.",
      });
    }

    const actingUserId = getUserIdFromAuth(res);
    await deleteSingleRoleService(id, actingUserId);

    res.status(200).json({
      success: true,
      message: "Role and associated permissions are deleted successfully",
    });
  },
);
