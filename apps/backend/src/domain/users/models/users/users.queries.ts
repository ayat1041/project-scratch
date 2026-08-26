import { db } from "@/db/db";
import {
  appPermissionsTable,
  appPermissionToRolesTable,
  appRolesTable,
  appUserRolesTable,
  appUsersTable,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { AppUsers } from "@repo/schemas-types/tables/entity-types";

export interface UserInfoResponse {
  id: string;
  email: NonNullable<AppUsers["email"]>;
  userName: NonNullable<AppUsers["userName"]>;
  profileImage?: Exclude<AppUsers["profileImage"], undefined>;
  providerName: NonNullable<AppUsers["providerName"]>;
  isVerified: NonNullable<AppUsers["isVerified"]>;
  isDeleted: NonNullable<AppUsers["isDeleted"]>;
  registeredAt: NonNullable<AppUsers["registeredAt"]>;
  roles: string[];
  permissions: string[];
}

export interface UserVerificationInfoResponse extends UserInfoResponse {
  password: NonNullable<AppUsers["password"]>;
}

/**
 * Check if user exists by email (lightweight query)
 * @param email - User's email address
 * @returns User existence info
 */
export const checkUserExistsByEmail = async (email: string) => {
  const user = await db
    .select()
    .from(appUsersTable)
    .where(eq(appUsersTable.email, email))
    .limit(1);

  return user.length > 0 ? user[0] : null;
};

/**
 * Get user by ID with full roles and permissions
 * @param userId - User ID
 * @returns Complete user info with roles and permissions
 */
export const getUserByIdWithRolesAndPermissions = async (
  userId: string,
): Promise<UserVerificationInfoResponse | null> => {
  const userInfo = await db
    .select({
      id: appUsersTable.id,
      email: appUsersTable.email,
      password: appUsersTable.password,
      userName: appUsersTable.userName,
      profileImage: appUsersTable.profileImage,
      providerName: appUsersTable.providerName,
      isVerified: appUsersTable.isVerified,
      isDeleted: appUsersTable.isDeleted,
      registeredAt: appUsersTable.registeredAt,
      roles: sql<string>`STRING_AGG(DISTINCT ${appRolesTable.name}, ',')`,
      permissions: sql<string>`STRING_AGG(DISTINCT ${appPermissionsTable.name}, ',')`,
    })
    .from(appUsersTable)
    .where(and(eq(appUsersTable.id, userId), eq(appUsersTable.isDeleted, false)))
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
      appUsersTable.isVerified,
      appUsersTable.isDeleted,
      appUsersTable.registeredAt,
    );

  if (!userInfo || userInfo.length === 0) {
    return null;
  }

  const user = userInfo[0];

  const permissionsArray = user.permissions
    ? user.permissions.split(",").filter(Boolean)
    : [];
  const rolesArray = user.roles ? user.roles.split(",").filter(Boolean) : [];

  return {
    id: user.id,
    email: user.email,
    userName: user.userName,
    password: user.password,
    profileImage: user.profileImage,
    providerName: user.providerName,
    isVerified: user.isVerified,
    isDeleted: user.isDeleted,
    registeredAt: user.registeredAt,
    roles: rolesArray,
    permissions: permissionsArray,
  };
};

/**
 * Get user by Email with full roles and permissions
 * @param email - User Email
 * @returns Complete user info with roles and permissions
 */
export const getUserByEmailWithRolesAndPermissions = async (
  email: string,
): Promise<UserVerificationInfoResponse | null> => {
  const userInfo = await db
    .select({
      id: appUsersTable.id,
      email: appUsersTable.email,
      password: appUsersTable.password,
      userName: appUsersTable.userName,
      profileImage: appUsersTable.profileImage,
      providerName: appUsersTable.providerName,
      isVerified: appUsersTable.isVerified,
      isDeleted: appUsersTable.isDeleted,
      registeredAt: appUsersTable.registeredAt,
      roles: sql<string>`STRING_AGG(DISTINCT ${appRolesTable.name}, ',')`,
      permissions: sql<string>`STRING_AGG(DISTINCT ${appPermissionsTable.name}, ',')`,
    })
    .from(appUsersTable)
    .where(
      and(eq(appUsersTable.email, email), eq(appUsersTable.isDeleted, false)),
    )
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
      appUsersTable.isVerified,
      appUsersTable.isDeleted,
      appUsersTable.registeredAt,
    );

  if (!userInfo || userInfo.length === 0) {
    return null;
  }

  const user = userInfo[0];

  const permissionsArray = user.permissions
    ? user.permissions.split(",").filter(Boolean)
    : [];
  const rolesArray = user.roles ? user.roles.split(",").filter(Boolean) : [];

  return {
    id: user.id,
    email: user.email,
    userName: user.userName,
    password: user.password,
    profileImage: user.profileImage,
    providerName: user.providerName,
    isVerified: user.isVerified,
    isDeleted: user.isDeleted,
    registeredAt: user.registeredAt,
    roles: rolesArray,
    permissions: permissionsArray,
  };
};

export const getUserIdByEmail = async (
  email: string,
): Promise<string | null> => {
  const result = await db
    .select({ id: appUsersTable.id })
    .from(appUsersTable)
    .where(eq(appUsersTable.email, email))
    .limit(1);

  return result.length > 0 ? result[0].id : null;
};

export const userExists = async (
  userId: string,
  dbOrTx: unknown = db,
): Promise<{ success: boolean; userId: string | null }> => {
  const executor = dbOrTx as typeof db;

  const record = await executor
    .select({ id: appUsersTable.id })
    .from(appUsersTable)
    .where(eq(appUsersTable.id, userId))
    .limit(1);

  return {
    success: record.length > 0 ? true : false,
    userId: record.length > 0 ? record[0].id : null,
  };
};
