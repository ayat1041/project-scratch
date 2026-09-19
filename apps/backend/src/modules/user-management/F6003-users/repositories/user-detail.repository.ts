import { db } from "@/db/db";
import {
  appPermissionsTable,
  appPermissionToRolesTable,
  appRolesTable,
  appUserRolesTable,
  appUsersTable,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export interface AdminUserDetailRow {
  id: string;
  email: string;
  userName: string;
  profileImage: string | null;
  providerName: string;
  userOrigin: string;
  invitedBy: string | null;
  isVerified: boolean;
  isDeleted: boolean;
  registeredAt: Date;
  roles: string;
  permissions: string;
}

/**
 * Admin-facing equivalent of `getUserByIdWithRolesAndPermissions` that does
 * NOT filter out deactivated (`isDeleted`) users — admins need to view and
 * reactivate deactivated accounts, unlike the auth-flow query this mirrors.
 */
export const getUserWithRolesAndPermissionsForAdmin = async (
  userId: string,
): Promise<AdminUserDetailRow | null> => {
  const [row] = await db
    .select({
      id: appUsersTable.id,
      email: appUsersTable.email,
      userName: appUsersTable.userName,
      profileImage: appUsersTable.profileImage,
      providerName: appUsersTable.providerName,
      userOrigin: appUsersTable.userOrigin,
      invitedBy: appUsersTable.invitedBy,
      isVerified: appUsersTable.isVerified,
      isDeleted: appUsersTable.isDeleted,
      registeredAt: appUsersTable.registeredAt,
      roles: sql<string>`STRING_AGG(DISTINCT ${appRolesTable.name}, ',')`,
      permissions: sql<string>`STRING_AGG(DISTINCT ${appPermissionsTable.name}, ',')`,
    })
    .from(appUsersTable)
    .where(eq(appUsersTable.id, userId))
    .leftJoin(appUserRolesTable, eq(appUsersTable.id, appUserRolesTable.userId))
    .leftJoin(appRolesTable, eq(appUserRolesTable.roleId, appRolesTable.id))
    .leftJoin(
      appPermissionToRolesTable,
      eq(appRolesTable.id, appPermissionToRolesTable.roleId),
    )
    .leftJoin(
      appPermissionsTable,
      eq(appPermissionToRolesTable.permissionId, appPermissionsTable.id),
    )
    .groupBy(
      appUsersTable.id,
      appUsersTable.email,
      appUsersTable.userName,
      appUsersTable.profileImage,
      appUsersTable.providerName,
      appUsersTable.userOrigin,
      appUsersTable.invitedBy,
      appUsersTable.isVerified,
      appUsersTable.isDeleted,
      appUsersTable.registeredAt,
    );

  return row ?? null;
};
