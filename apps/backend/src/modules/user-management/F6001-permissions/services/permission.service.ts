import { db } from "@/db/db";
import { appPermissionToRolesTable, appPermissionsTable, appRolesTable } from "@/db/schema";
import { createError } from "@/middleware/error.middleware";
import { invalidateAllUsersCache } from "@/utils/cache-invalidation.utils";
import { count, desc, eq, inArray, sql } from "drizzle-orm";

type ListPermissionsParams = {
  search?: string;
  limit: number;
  offset: number;
  sort: string;
};

type UpsertPermissionParams = {
  name: string;
  description: string | null;
};

export const listAllPermissionsService = async ({
  search,
  limit,
  offset,
  sort,
}: ListPermissionsParams) => {
  const query = db
    .select({
      id: appPermissionsTable.id,
      name: appPermissionsTable.name,
      description: appPermissionsTable.description,
      createdAt: appPermissionsTable.createdAt,
      updatedAt: appPermissionsTable.updatedAt,
      roleCount: sql<number>`count(distinct ${appPermissionToRolesTable.roleId})::int`,
    })
    .from(appPermissionsTable)
    .leftJoin(
      appPermissionToRolesTable,
      eq(appPermissionsTable.id, appPermissionToRolesTable.permissionId),
    )
    .groupBy(
      appPermissionsTable.id,
      appPermissionsTable.name,
      appPermissionsTable.description,
      appPermissionsTable.createdAt,
      appPermissionsTable.updatedAt,
    )
    .orderBy(
      sort === "desc" ? desc(appPermissionsTable.id) : appPermissionsTable.id,
    )
    .limit(limit)
    .offset(offset);

  if (search) {
    query.where(
      sql`LOWER(${appPermissionsTable.name}) ILIKE LOWER(${"%" + search + "%"})`,
    );
  }

  const permissions = await query;

  const totalCountQuery = db
    .select({ count: count() })
    .from(appPermissionsTable);
  if (search) {
    totalCountQuery.where(
      sql`LOWER(${appPermissionsTable.name}) ILIKE LOWER(${"%" + search + "%"})`,
    );
  }

  const totalCount = await totalCountQuery;

  return {
    permissions,
    total: totalCount[0]?.count || 0,
  };
};

export const getSinglePermissionService = async (id: string) => {
  const permission = await db
    .select()
    .from(appPermissionsTable)
    .where(sql`${appPermissionsTable.id} = ${sql.param(id)}`)
    .leftJoin(
      appPermissionToRolesTable,
      sql`${appPermissionsTable.id} = ${appPermissionToRolesTable.permissionId}`,
    )
    .leftJoin(
      appRolesTable,
      sql`${appPermissionToRolesTable.roleId} = ${appRolesTable.id}`,
    );

  if (permission.length === 0) {
    throw createError.notFound("Permission not found", {
      error: "No permission found with the provided ID",
      hint: "Please check the permission ID and try again.",
    });
  }

  return {
    permission: permission[0].app_permissions,
    roles: permission
      .filter((row) => row.app_roles)
      .map((row) => row.app_roles),
  };
};

export const createPermissionService = async ({
  name,
  description,
}: UpsertPermissionParams) => {
  const permissionExists = await db
    .select()
    .from(appPermissionsTable)
    .where(sql`${appPermissionsTable.name} = ${sql.param(name)}`);

  if (permissionExists.length > 0) {
    throw createError.conflict("Permission already exists", {
      error: "Permission with this name already exists",
      hint: "Please choose a different name for the permission.",
    });
  }

  return db
    .insert(appPermissionsTable)
    .values({ name, description })
    .returning();
};

export const updateSinglePermissionService = async (
  id: string,
  { name, description }: UpsertPermissionParams,
) => {
  const existingPermission = await db
    .select()
    .from(appPermissionsTable)
    .where(sql`${appPermissionsTable.id} = ${sql.param(id)}`);

  if (existingPermission.length === 0) {
    throw createError.notFound("Permission not found", {
      error: "No permission found with the provided ID",
      hint: "Please check the permission ID and try again.",
    });
  }

  const nameConflict = await db
    .select()
    .from(appPermissionsTable)
    .where(sql`${appPermissionsTable.name} = ${sql.param(name)}`);

  if (nameConflict.length > 0 && nameConflict[0].id !== parseInt(id, 10)) {
    throw createError.conflict("Permission already exists with the same name", {
      error: "Permission with this name already exists",
      hint: "Please choose a different name for the permission.",
    });
  }

  return db
    .update(appPermissionsTable)
    .set({ name, description })
    .where(sql`${appPermissionsTable.id} = ${sql.param(id)}`)
    .returning();
};

const deletePermissionsByIds = async (ids: number[]) => {
  await db
    .delete(appPermissionToRolesTable)
    .where(inArray(appPermissionToRolesTable.permissionId, ids));

  const deleted = await db
    .delete(appPermissionsTable)
    .where(inArray(appPermissionsTable.id, ids))
    .returning({ id: appPermissionsTable.id });

  await invalidateAllUsersCache();

  return deleted;
};

export const deleteSinglePermissionService = async (id: string) => {
  const permissionId = parseInt(id, 10);

  const existingPermission = await db
    .select()
    .from(appPermissionsTable)
    .where(eq(appPermissionsTable.id, permissionId));

  if (existingPermission.length === 0) {
    throw createError.notFound("Permission not found", {
      error: "No permission found with the provided ID",
      hint: "Please check the permission ID and try again.",
    });
  }

  return deletePermissionsByIds([permissionId]);
};

export const bulkDeletePermissionsService = async (ids: number[]) => {
  if (ids.length === 0) {
    throw createError.validation("No permission IDs provided", {
      error: "The ids array is empty",
      hint: "Please provide at least one permission ID to delete.",
    });
  }

  return deletePermissionsByIds(ids);
};
