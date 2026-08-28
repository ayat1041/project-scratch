import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { createError } from "@/middleware/error.middleware";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { getUserIdFromAuth } from "@/modules/auth/auth.utils";
import {
  AdminBulkUpdateUserStatusPayloadValidationSchema,
  AdminCreateUserPayloadValidationSchema,
  AdminUpdateUserRolesPayloadValidationSchema,
  AdminUpdateUserStatusPayloadValidationSchema,
} from "@repo/schemas-types/payload-schemas/admin/users/payload.schema";
import type { UserStatusFilter } from "../repositories/users-list.repository";
import {
  bulkUpdateUserStatusService,
  createUserService,
  getUserDetailService,
  listUsersService,
  updateUserRolesService,
  updateUserStatusService,
} from "../services/users.service";

const VALID_STATUSES: UserStatusFilter[] = ["active", "deactivated", "unverified", "all"];

const normalizeParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const requireUserId = (req: Request): string => {
  const id = normalizeParam(req.params.id);
  if (!id) {
    throw createError.validation("User ID is required", {
      error: "User ID is missing in the request parameters",
      hint: "Please provide a valid user ID.",
    });
  }
  return id;
};

export const listUsersController = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const offset = parseInt(req.query.offset as string, 10) || 0;
  const search = req.query.search ? String(req.query.search).trim() : undefined;
  const role = req.query.role ? String(req.query.role).trim() : undefined;
  const rawStatus = req.query.status ? String(req.query.status) : "all";
  const sortField = req.query.sortField ? String(req.query.sortField) : undefined;
  const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

  if (limit < 0 || offset < 0) {
    throw createError.validation("Invalid limit or offset", {
      error: "Limit and offset must be non-negative integers.",
      hint: "Please provide valid limit and offset values.",
    });
  }

  const status = (VALID_STATUSES as string[]).includes(rawStatus)
    ? (rawStatus as UserStatusFilter)
    : "all";

  const result = await listUsersService({ search, role, status, limit, offset, sortField, sortOrder });
  res.status(200).json({ success: true, message: "Users retrieved successfully", ...result });
});

export const getUserController = asyncHandler(async (req: Request, res: Response) => {
  const id = requireUserId(req);
  const data = await getUserDetailService(id);
  res.status(200).json({ success: true, data });
});

export const createUserController = asyncHandler(async (req: Request, res: Response) => {
  const payload = validateZodSchema(AdminCreateUserPayloadValidationSchema)(req.body);
  const actingUserId = getUserIdFromAuth(res);

  const data = await createUserService(payload, actingUserId);
  res.status(201).json({ success: true, message: "User created successfully", data });
});

export const updateUserRolesController = asyncHandler(async (req: Request, res: Response) => {
  const id = requireUserId(req);
  const { roleIds } = validateZodSchema(AdminUpdateUserRolesPayloadValidationSchema)(req.body);
  const actingUserId = getUserIdFromAuth(res);

  const data = await updateUserRolesService(id, roleIds, actingUserId);
  res.status(200).json({ success: true, message: "User roles updated successfully", data });
});

export const updateUserStatusController = asyncHandler(async (req: Request, res: Response) => {
  const id = requireUserId(req);
  const { isDeleted } = validateZodSchema(AdminUpdateUserStatusPayloadValidationSchema)(req.body);
  const actingUserId = getUserIdFromAuth(res);

  const data = await updateUserStatusService(id, isDeleted, actingUserId);
  res.status(200).json({
    success: true,
    message: isDeleted ? "User deactivated successfully" : "User activated successfully",
    data,
  });
});

export const bulkUpdateUserStatusController = asyncHandler(async (req: Request, res: Response) => {
  const { ids, isDeleted } = validateZodSchema(AdminBulkUpdateUserStatusPayloadValidationSchema)(req.body);
  const actingUserId = getUserIdFromAuth(res);

  const data = await bulkUpdateUserStatusService(ids, isDeleted, actingUserId);
  res.status(200).json({
    success: true,
    message: isDeleted ? "Users deactivated successfully" : "Users activated successfully",
    data,
  });
});
