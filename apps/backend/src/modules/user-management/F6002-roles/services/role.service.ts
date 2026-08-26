import { db } from "@/db/db";
import {
  appPermissionsTable,
  appPermissionToRolesTable,
  appRolesTable,
} from "@/db/schema";
import { createError } from "@/middleware/error.middleware";
import { invalidateAllUsersCache } from "@/utils/cache-invalidation.utils";
import { desc, eq, sql } from "drizzle-orm";

type ListRolesParams = {
  search?: string;
  limit: number;
  offset: number;
  sort: string;
};

type UpsertRoleParams = {
  name: string;
  description: string | null;
  permissions: number[];
};

export const listAllRolesService = async ({
  search,
  limit,
  offset,
  sort,
}: ListRolesParams) => {
  const rolesQuery = db
    .select({
      id: appRolesTable.id,
      name: appRolesTable.name,
      description: appRolesTable.description,
      createdAt: appRolesTable.createdAt,
      updatedAt: appRolesTable.updatedAt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      permissions: sql<any[]>`
        COALESCE(
          JSON_AGG(
            CASE
              WHEN ${appPermissionsTable.id} IS NOT NULL
              THEN JSON_BUILD_OBJECT(
                'id', ${appPermissionsTable.id},
                'name', ${appPermissionsTable.name},
                'description', ${appPermissionsTable.description}
              )
              ELSE NULL
            END
          ) FILTER (WHERE ${appPermissionsTable.id} IS NOT NULL),
          '[]'::json
        )
      `,
      totalCount: sql<number>`COUNT(*) OVER()`,
    })
    .from(appRolesTable)
    .leftJoin(
      appPermissionToRolesTable,
      eq(appRolesTable.id, appPermissionToRolesTable.roleId),
    )
    .leftJoin(
      appPermissionsTable,
      eq(appPermissionToRolesTable.permissionId, appPermissionsTable.id),
    )
    .groupBy(
      appRolesTable.id,
      appRolesTable.name,
      appRolesTable.description,
      appRolesTable.createdAt,
      appRolesTable.updatedAt,
    )
    .orderBy(sort === "desc" ? desc(appRolesTable.id) : appRolesTable.id)
    .limit(limit)
    .offset(offset);

  if (search) {
    rolesQuery.where(
      sql`LOWER(${appRolesTable.name}) ILIKE LOWER(${"%" + search + "%"})`,
    );
  }

  const results = await rolesQuery;
  const total = results.length > 0 ? results[0].totalCount : 0;

  return {
    results,
    total,
  };
};

export const getSingleRoleService = async (id: string) => {
  const role = await db
    .select()
    .from(appRolesTable)
    .where(sql`${appRolesTable.id} = ${sql.param(id)}`)
    .leftJoin(
      appPermissionToRolesTable,
      sql`${appRolesTable.id} = ${appPermissionToRolesTable.roleId}`,
    )
    .leftJoin(
      appPermissionsTable,
      sql`${appPermissionToRolesTable.permissionId} = ${appPermissionsTable.id}`,
    );

  if (role.length === 0) {
    throw createError.notFound("Role not found", {
      error: "No role found with the provided ID",
      hint: "Please check the role ID and try again.",
    });
  }

  return {
    role: role[0].app_roles,
    permissions: role
      .filter((row) => row.app_permissions)
      .map((row) => row.app_permissions),
  };
};

export const createRoleService = async ({
  name,
  description,
  permissions,
}: UpsertRoleParams) => {
  const roleExists = await db
    .select()
    .from(appRolesTable)
    .where(sql`${appRolesTable.name} = ${sql.param(name)}`);

  if (roleExists.length > 0) {
    throw createError.validation("Role already exists", {
      error: "Role with this name already exists",
      hint: "Please choose a different name for the role.",
    });
  }

  if (permissions.length === 0) {
    throw createError.validation("Permissions are required", {
      error: "At least one permission is required to create a role",
      hint: "Please provide at least one valid permission ID.",
    });
  }

  const newRole = await db
    .insert(appRolesTable)
    .values({ name, description })
    .returning();

  const newRolePermissions = permissions.map((permissionId) => ({
    roleId: newRole[0].id,
    permissionId,
  }));

  await db
    .insert(appPermissionToRolesTable)
    .values(newRolePermissions)
    .execute();

  return newRole;
};

export const updateSingleRoleService = async (
  id: string,
  { name, description, permissions }: UpsertRoleParams,
) => {
  const roleExists = await db
    .select()
    .from(appRolesTable)
    .where(sql`${appRolesTable.id} = ${sql.param(id)}`);

  if (roleExists.length === 0) {
    throw createError.notFound("Role not found", {
      error: "No role found with the provided ID",
      hint: "Please check the role ID and try again.",
    });
  }

  const roleExistsWithSameName = await db
    .select()
    .from(appRolesTable)
    .where(sql`${appRolesTable.name} = ${sql.param(name)}`);

  if (
    roleExistsWithSameName.length > 0 &&
    roleExistsWithSameName[0].id !== +id
  ) {
    throw createError.validation("Role with this name already exists", {
      error: "Role with this name already exists",
      hint: "Please choose a different name for the role.",
    });
  }

  if (permissions.length === 0) {
    throw createError.validation("Permissions are required", {
      error: "At least one permission is required to update a role",
      hint: "Please provide at least one valid permission ID.",
    });
  }

  const updatedRole = await db
    .update(appRolesTable)
    .set({ name, description })
    .where(sql`${appRolesTable.id} = ${sql.param(id)}`)
    .returning();

  await db
    .delete(appPermissionToRolesTable)
    .where(sql`${appPermissionToRolesTable.roleId} = ${sql.param(id)}`)
    .execute();

  const newRolePermissions = permissions.map((permissionId) => ({
    roleId: updatedRole[0].id,
    permissionId,
  }));

  await db
    .insert(appPermissionToRolesTable)
    .values(newRolePermissions)
    .execute();

  await invalidateAllUsersCache();

  return updatedRole;
};

export const deleteSingleRoleService = async (id: string) => {
  const roleExists = await db
    .select()
    .from(appRolesTable)
    .where(sql`${appRolesTable.id} = ${sql.param(id)}`);

  if (roleExists.length === 0) {
    throw createError.notFound("Role not found", {
      error: "No role found with the provided ID",
      hint: "Please check the role ID and try again.",
    });
  }

  await db
    .delete(appRolesTable)
    .where(sql`${appRolesTable.id} = ${sql.param(id)}`)
    .execute();

  await db
    .delete(appPermissionToRolesTable)
    .where(sql`${appPermissionToRolesTable.roleId} = ${sql.param(id)}`)
    .execute();

  await invalidateAllUsersCache();
};
