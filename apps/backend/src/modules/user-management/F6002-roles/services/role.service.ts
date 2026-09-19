import { db } from "@/db/db";
import {
  appPermissionsTable,
  appPermissionToRolesTable,
  appRolesTable,
  appUserRolesTable,
} from "@/db/schema";
import { createError } from "@/middleware/error.middleware";
import { invalidateAllUsersCache } from "@/utils/cache-invalidation.utils";
import { getUserByIdWithRolesAndPermissions } from "@/domain/users/models/users/users.queries";
import { PERMISSIONS, ROLES } from "@repo/constants";
import { and, desc, eq, ne, sql } from "drizzle-orm";

const ADMINISTRATION_ACCESS = PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS;

const getAdministrationAccessPermissionId = async (): Promise<number | null> => {
  const [row] = await db
    .select({ id: appPermissionsTable.id })
    .from(appPermissionsTable)
    .where(eq(appPermissionsTable.name, ADMINISTRATION_ACCESS));
  return row?.id ?? null;
};

const userHasAdminAccessViaOtherRole = async (
  userId: string,
  excludingRoleId: number,
): Promise<boolean> => {
  const rows = await db
    .select({ roleId: appRolesTable.id })
    .from(appUserRolesTable)
    .innerJoin(appRolesTable, eq(appUserRolesTable.roleId, appRolesTable.id))
    .innerJoin(
      appPermissionToRolesTable,
      eq(appRolesTable.id, appPermissionToRolesTable.roleId),
    )
    .innerJoin(
      appPermissionsTable,
      eq(appPermissionToRolesTable.permissionId, appPermissionsTable.id),
    )
    .where(
      and(
        eq(appUserRolesTable.userId, userId),
        eq(appPermissionsTable.name, ADMINISTRATION_ACCESS),
        ne(appRolesTable.id, excludingRoleId),
      ),
    );

  return rows.length > 0;
};

/**
 * Self-lockout guard: blocks an admin from removing ADMINISTRATION_ACCESS
 * from a role they currently hold when they have no other admin-granting
 * role. Scoped to the acting user only — does not attempt to check whether
 * *other* users assigned to this role would also lose admin access.
 */
const assertNotSelfLockout = async (
  roleId: number,
  actingUserId: string,
  retainsAdminAccess: boolean,
) => {
  if (retainsAdminAccess) return;

  const [actingUserHasThisRole] = await db
    .select({ userId: appUserRolesTable.userId })
    .from(appUserRolesTable)
    .where(
      and(
        eq(appUserRolesTable.userId, actingUserId),
        eq(appUserRolesTable.roleId, roleId),
      ),
    );

  if (!actingUserHasThisRole) return;

  const hasOtherAdminRole = await userHasAdminAccessViaOtherRole(actingUserId, roleId);
  if (!hasOtherAdminRole) {
    throw createError.validation(
      "You cannot remove your own administration access",
      {
        error: "This change would remove ADMINISTRATION_ACCESS from your only admin-granting role",
        hint: "Assign yourself another admin role first, or have another admin make this change.",
      },
    );
  }
};

/**
 * Privilege-escalation guard: only a caller who currently holds SUPER_ADMIN
 * may create/edit a role that grants ADMINISTRATION_ACCESS.
 */
const assertCanGrantAdministrationAccess = async (
  actingUserId: string,
  willGrantAdminAccess: boolean,
) => {
  if (!willGrantAdminAccess) return;

  const actingUser = await getUserByIdWithRolesAndPermissions(actingUserId);
  if (!actingUser?.roles.includes(ROLES.SUPER_ADMIN)) {
    throw createError.forbidden(
      "Only a super admin can create or edit a role that grants administration access",
      {
        error: "Caller does not hold the super_admin role",
        hint: "Ask a super admin to make this change.",
      },
    );
  }
};

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
      scope: appRolesTable.scope,
      isSystemRole: appRolesTable.isSystemRole,
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
      appRolesTable.scope,
      appRolesTable.isSystemRole,
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

export const createRoleService = async (
  { name, description, permissions }: UpsertRoleParams,
  actingUserId: string,
) => {
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

  const adminAccessPermissionId = await getAdministrationAccessPermissionId();
  const willGrantAdminAccess = adminAccessPermissionId != null && permissions.includes(adminAccessPermissionId);
  await assertCanGrantAdministrationAccess(actingUserId, willGrantAdminAccess);

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
  actingUserId: string,
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

  const adminAccessPermissionId = await getAdministrationAccessPermissionId();
  const willGrantAdminAccess = adminAccessPermissionId != null && permissions.includes(adminAccessPermissionId);
  const retainsAdminAccess = adminAccessPermissionId == null || willGrantAdminAccess;
  await assertNotSelfLockout(+id, actingUserId, retainsAdminAccess);
  await assertCanGrantAdministrationAccess(actingUserId, willGrantAdminAccess);

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

export const deleteSingleRoleService = async (id: string, actingUserId: string) => {
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

  if (roleExists[0].isSystemRole) {
    throw createError.conflict("System roles cannot be deleted", {
      error: "The requested role is a protected system role",
      hint: "System roles are required for the platform to function and cannot be removed.",
    });
  }

  await assertNotSelfLockout(+id, actingUserId, false);

  // Delete the join rows before the role row — app_permission_to_roles has no
  // ON DELETE cascade on role_id, so deleting the role first violates its FK.
  await db
    .delete(appPermissionToRolesTable)
    .where(sql`${appPermissionToRolesTable.roleId} = ${sql.param(id)}`)
    .execute();

  await db
    .delete(appRolesTable)
    .where(sql`${appRolesTable.id} = ${sql.param(id)}`)
    .execute();

  await invalidateAllUsersCache();
};
