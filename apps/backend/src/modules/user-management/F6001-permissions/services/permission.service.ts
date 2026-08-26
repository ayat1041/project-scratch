import { db } from "@/db/db";
import { appPermissionsTable } from "@/db/schema";
import { createError } from "@/middleware/error.middleware";
import { count, desc, sql } from "drizzle-orm";

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
    .select()
    .from(appPermissionsTable)
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
    .where(sql`${appPermissionsTable.id} = ${sql.param(id)}`);

  if (permission.length === 0) {
    throw createError.notFound("Permission not found", {
      error: "No permission found with the provided ID",
      hint: "Please check the permission ID and try again.",
    });
  }

  return permission;
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
  const permissionExists = await db
    .select()
    .from(appPermissionsTable)
    .where(sql`${appPermissionsTable.name} = ${sql.param(name)}`);

  if (permissionExists.length === 0) {
    throw createError.notFound("Permission not found", {
      error: "No permission found with the provided name",
      hint: "Please check the permission name and try again.",
    });
  }

  if (
    permissionExists.length > 0 &&
    permissionExists[0].id !== parseInt(id, 10)
  ) {
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
