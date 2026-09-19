import { db } from "@/db/db";
import { appRolesTable, appUserRolesTable } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export interface RoleRow {
  id: number;
  name: string;
}

export const getRolesByIds = async (roleIds: number[]): Promise<RoleRow[]> => {
  if (roleIds.length === 0) return [];
  return db
    .select({ id: appRolesTable.id, name: appRolesTable.name })
    .from(appRolesTable)
    .where(inArray(appRolesTable.id, roleIds));
};

export const getRoleByName = async (name: string): Promise<RoleRow | undefined> => {
  const [row] = await db
    .select({ id: appRolesTable.id, name: appRolesTable.name })
    .from(appRolesTable)
    .where(eq(appRolesTable.name, name));
  return row;
};

export const getUserRoles = async (userId: string): Promise<RoleRow[]> => {
  return db
    .select({ id: appRolesTable.id, name: appRolesTable.name })
    .from(appUserRolesTable)
    .innerJoin(appRolesTable, eq(appUserRolesTable.roleId, appRolesTable.id))
    .where(eq(appUserRolesTable.userId, userId));
};

export const replaceUserRoles = async (userId: string, roleIds: number[]): Promise<void> => {
  await db.transaction(async (tx) => {
    await tx.delete(appUserRolesTable).where(eq(appUserRolesTable.userId, userId));
    if (roleIds.length > 0) {
      await tx.insert(appUserRolesTable).values(roleIds.map((roleId) => ({ userId, roleId })));
    }
  });
};
