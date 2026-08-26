import { db } from "@/db/db";
import { appRolesTable } from "@/db/schema";
import { createError } from "@/middleware/error.middleware";
import { eq } from "drizzle-orm";

/**
 * Validates that a role exists and returns its ID
 * @param title - Role name to validate
 * @returns Role ID
 * @throws Error if role does not exist
 */
export const getRoleByTitle = async (title: string): Promise<number> => {
  const roleId = await db
    .select({ id: appRolesTable.id })
    .from(appRolesTable)
    .where(eq(appRolesTable.name, title))
    .limit(1);

  if (!roleId || roleId.length === 0) {
    throw createError.validation("Invalid role", { error: "Role not found" });
  }

  return roleId[0].id;
};
