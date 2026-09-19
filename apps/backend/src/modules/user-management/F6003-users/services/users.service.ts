import { db } from "@/db/db";
import { appPermissionToRolesTable, appPermissionsTable } from "@/db/schema";
import { createError } from "@/middleware/error.middleware";
import { invalidateAllUsersCache } from "@/utils/cache-invalidation.utils";
import { and, eq, inArray } from "drizzle-orm";
import { PERMISSIONS, ROLES } from "@repo/constants";
import {
  createUser,
  softDeleteUser,
  updateUser as updateUserCommand,
  verifyUser,
} from "@/domain/users/models/users/users.commands";
import { getUserByIdWithRolesAndPermissions } from "@/domain/users/models/users/users.queries";
import { getUserWithRolesAndPermissionsForAdmin } from "../repositories/user-detail.repository";
import type { AdminCreateUserPayloadValidationSchemaType } from "@repo/schemas-types/payload-schemas/admin/users/payload.schema";
import type {
  UserDetailResponseType,
  UserListItemResponseType,
} from "@repo/schemas-types/payload-schemas/admin/users/response.schema";
import {
  getRolesByIds,
  getUserRoles,
  replaceUserRoles,
} from "../repositories/user-roles.repository";
import {
  listUsers,
  type ListUsersParams,
  type UserStatusCounts,
} from "../repositories/users-list.repository";

const assertRolesExist = async (roleIds: number[]) => {
  const roles = await getRolesByIds(roleIds);
  if (roles.length !== new Set(roleIds).size) {
    throw createError.validation("One or more roles do not exist", {
      error: "Invalid role ID in roleIds",
      hint: "Please provide only valid, existing role IDs.",
    });
  }
  return roles;
};

const rolesGrantAdministrationAccess = async (roleIds: number[]): Promise<boolean> => {
  if (roleIds.length === 0) return false;
  const rows = await db
    .select({ roleId: appPermissionToRolesTable.roleId })
    .from(appPermissionToRolesTable)
    .innerJoin(
      appPermissionsTable,
      eq(appPermissionToRolesTable.permissionId, appPermissionsTable.id),
    )
    .where(
      and(
        inArray(appPermissionToRolesTable.roleId, roleIds),
        eq(appPermissionsTable.name, PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS),
      ),
    );
  return rows.length > 0;
};

const assertCanGrantSuperAdmin = async (actingUserId: string, roleIds: number[], roles: { id: number; name: string }[]) => {
  const grantsSuperAdmin = roles.some((role) => role.name === ROLES.SUPER_ADMIN);
  if (!grantsSuperAdmin) return;

  const actingUser = await getUserByIdWithRolesAndPermissions(actingUserId);
  if (!actingUser?.roles.includes(ROLES.SUPER_ADMIN)) {
    throw createError.forbidden(
      "Only a super admin can grant the super admin role",
      {
        error: "Caller does not hold the super_admin role",
        hint: "Ask a super admin to make this change.",
      },
    );
  }
};

export const listUsersService = async (params: ListUsersParams) => {
  const { rows, totalItems, statusCounts } = await listUsers(params);

  const data: UserListItemResponseType[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    userName: row.userName,
    roles: row.roles ? row.roles.split(",").filter(Boolean) : [],
    isVerified: row.isVerified,
    isDeleted: row.isDeleted,
    registeredAt: row.registeredAt.toISOString(),
  }));

  const totalPages = Math.max(1, Math.ceil(totalItems / params.limit));
  const statusSummary = buildStatusSummary(statusCounts);

  return {
    data,
    pagination: { limit: params.limit, offset: params.offset, totalItems, totalPages },
    counts: { statusSummary },
  };
};

const STATUS_LABELS: Record<keyof UserStatusCounts, string> = {
  all: "All",
  active: "Active",
  deactivated: "Deactivated",
  unverified: "Unverified",
};

const buildStatusSummary = (counts: UserStatusCounts) =>
  (Object.keys(STATUS_LABELS) as (keyof UserStatusCounts)[]).map((value) => ({
    value,
    label: STATUS_LABELS[value],
    count: counts[value],
  }));

export const getUserDetailService = async (userId: string): Promise<UserDetailResponseType> => {
  const user = await getUserWithRolesAndPermissionsForAdmin(userId);
  if (!user) {
    throw createError.notFound("User not found", {
      error: "No user found with the provided ID",
      hint: "Please check the user ID and try again.",
    });
  }

  const roles = await getUserRoles(userId);
  const permissions = user.permissions ? user.permissions.split(",").filter(Boolean) : [];

  return {
    id: user.id,
    email: user.email,
    userName: user.userName,
    profileImage: user.profileImage ?? null,
    providerName: user.providerName,
    userOrigin: user.userOrigin,
    invitedBy: user.invitedBy ?? null,
    isVerified: user.isVerified,
    isDeleted: user.isDeleted,
    registeredAt: user.registeredAt.toISOString(),
    roles,
    permissions,
  };
};

export const createUserService = async (
  payload: AdminCreateUserPayloadValidationSchemaType,
  actingUserId: string,
) => {
  const roles = await assertRolesExist(payload.roleIds);
  await assertCanGrantSuperAdmin(actingUserId, payload.roleIds, roles);

  const newUser = await createUser({
    email: payload.email,
    password: payload.password,
    userName: payload.name,
  });
  const newUserId = newUser.id!;

  await verifyUser(newUserId);
  await updateUserCommand(newUserId, {
    userOrigin: "admin_created",
    invitedBy: actingUserId,
  });

  await replaceUserRoles(newUserId, payload.roleIds);
  await invalidateAllUsersCache();

  return getUserDetailService(newUser.id!);
};

export const updateUserRolesService = async (
  targetUserId: string,
  roleIds: number[],
  actingUserId: string,
) => {
  const existingUser = await getUserWithRolesAndPermissionsForAdmin(targetUserId);
  if (!existingUser) {
    throw createError.notFound("User not found", {
      error: "No user found with the provided ID",
      hint: "Please check the user ID and try again.",
    });
  }

  const roles = await assertRolesExist(roleIds);
  await assertCanGrantSuperAdmin(actingUserId, roleIds, roles);

  if (targetUserId === actingUserId) {
    const willRetainAdminAccess = await rolesGrantAdministrationAccess(roleIds);
    if (!willRetainAdminAccess) {
      throw createError.validation(
        "You cannot remove your own administration access",
        {
          error: "This change would remove ADMINISTRATION_ACCESS from your account",
          hint: "Have another admin make this change instead.",
        },
      );
    }
  }

  await replaceUserRoles(targetUserId, roleIds);
  await invalidateAllUsersCache();

  return getUserDetailService(targetUserId);
};

export const updateUserStatusService = async (
  targetUserId: string,
  isDeleted: boolean,
  actingUserId: string,
) => {
  if (targetUserId === actingUserId && isDeleted) {
    throw createError.validation("You cannot deactivate your own account", {
      error: "Self-deactivation is not allowed",
      hint: "Ask another admin to deactivate this account.",
    });
  }

  const existingUser = await getUserWithRolesAndPermissionsForAdmin(targetUserId);
  if (!existingUser) {
    throw createError.notFound("User not found", {
      error: "No user found with the provided ID",
      hint: "Please check the user ID and try again.",
    });
  }

  if (isDeleted) {
    await softDeleteUser(targetUserId);
  } else {
    await updateUserCommand(targetUserId, { isDeleted: false });
  }
  await invalidateAllUsersCache();

  return getUserDetailService(targetUserId);
};

export const bulkUpdateUserStatusService = async (
  ids: string[],
  isDeleted: boolean,
  actingUserId: string,
) => {
  if (isDeleted && ids.includes(actingUserId)) {
    throw createError.validation("You cannot deactivate your own account", {
      error: "Self-deactivation is not allowed",
      hint: "Remove your own account from the selection and try again.",
    });
  }

  for (const id of ids) {
    if (isDeleted) {
      await softDeleteUser(id);
    } else {
      await updateUserCommand(id, { isDeleted: false });
    }
  }
  await invalidateAllUsersCache();

  return { updatedIds: ids };
};
