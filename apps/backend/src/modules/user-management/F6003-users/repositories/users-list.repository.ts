import { db } from "@/db/db";
import { appRolesTable, appUserRolesTable, appUsersTable } from "@/db/schema";
import { resolveSortableColumn } from "@/utils/paginated-list-query.utils";
import { AnyColumn, and, asc, desc, eq, ilike, inArray, or, sql, SQL } from "drizzle-orm";

export type UserStatusFilter = "active" | "deactivated" | "unverified" | "all";

export interface ListUsersParams {
  search?: string;
  role?: string;
  status: UserStatusFilter;
  limit: number;
  offset: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserListRow {
  id: string;
  email: string;
  userName: string;
  isVerified: boolean;
  isDeleted: boolean;
  registeredAt: Date;
  roles: string | null;
}

export interface UserStatusCounts {
  active: number;
  deactivated: number;
  unverified: number;
  all: number;
}

const SORTABLE_COLUMNS: Record<string, AnyColumn> = {
  email: appUsersTable.email,
  userName: appUsersTable.userName,
  registeredAt: appUsersTable.registeredAt,
};

const statusCondition = (status: UserStatusFilter): SQL | undefined => {
  if (status === "active") {
    return and(eq(appUsersTable.isDeleted, false), eq(appUsersTable.isVerified, true));
  }
  if (status === "deactivated") return eq(appUsersTable.isDeleted, true);
  if (status === "unverified") {
    return and(eq(appUsersTable.isDeleted, false), eq(appUsersTable.isVerified, false));
  }
  return undefined;
};

const getUserIdsForRole = async (role: string): Promise<string[]> => {
  const rows = await db
    .select({ userId: appUserRolesTable.userId })
    .from(appUserRolesTable)
    .innerJoin(appRolesTable, eq(appUserRolesTable.roleId, appRolesTable.id))
    .where(eq(appRolesTable.name, role));
  return rows.map((row) => row.userId);
};

export const listUsers = async ({
  search,
  role,
  status,
  limit,
  offset,
  sortField,
  sortOrder,
}: ListUsersParams): Promise<{ rows: UserListRow[]; totalItems: number; statusCounts: UserStatusCounts }> => {
  const baseConditions: SQL[] = [];

  if (search) {
    const searchCondition = or(
      ilike(appUsersTable.email, `%${search}%`),
      ilike(appUsersTable.userName, `%${search}%`),
    );
    if (searchCondition) baseConditions.push(searchCondition);
  }

  if (role) {
    const roleUserIds = await getUserIdsForRole(role);
    // No matches — force an empty result rather than an unfiltered one.
    baseConditions.push(inArray(appUsersTable.id, roleUserIds.length ? roleUserIds : ["00000000-0000-0000-0000-000000000000"]));
  }

  const baseWhere = baseConditions.length ? and(...baseConditions) : undefined;
  const statusCond = statusCondition(status);
  const dataWhere = statusCond ? (baseWhere ? and(baseWhere, statusCond) : statusCond) : baseWhere;

  const sortColumn = resolveSortableColumn<AnyColumn>(sortField, SORTABLE_COLUMNS, appUsersTable.registeredAt);
  const direction = sortOrder === "asc" ? asc : desc;

  const baseDataQuery = db
    .select({
      id: appUsersTable.id,
      email: appUsersTable.email,
      userName: appUsersTable.userName,
      isVerified: appUsersTable.isVerified,
      isDeleted: appUsersTable.isDeleted,
      registeredAt: appUsersTable.registeredAt,
      roles: sql<string>`STRING_AGG(DISTINCT ${appRolesTable.name}, ',')`,
    })
    .from(appUsersTable)
    .leftJoin(appUserRolesTable, eq(appUsersTable.id, appUserRolesTable.userId))
    .leftJoin(appRolesTable, eq(appUserRolesTable.roleId, appRolesTable.id))
    .groupBy(appUsersTable.id)
    .orderBy(direction(sortColumn), asc(appUsersTable.id))
    .limit(limit)
    .offset(offset);

  const rows = await (dataWhere ? baseDataQuery.where(dataWhere) : baseDataQuery);

  const baseCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(appUsersTable);
  const [totalRow] = await (dataWhere ? baseCountQuery.where(dataWhere) : baseCountQuery);

  const summaryQuery = db
    .select({
      active: sql<number>`count(*) filter (where ${appUsersTable.isDeleted} = false and ${appUsersTable.isVerified} = true)::int`,
      deactivated: sql<number>`count(*) filter (where ${appUsersTable.isDeleted} = true)::int`,
      unverified: sql<number>`count(*) filter (where ${appUsersTable.isDeleted} = false and ${appUsersTable.isVerified} = false)::int`,
      all: sql<number>`count(*)::int`,
    })
    .from(appUsersTable);
  const [summaryRow] = await (baseWhere ? summaryQuery.where(baseWhere) : summaryQuery);

  return {
    rows,
    totalItems: totalRow?.count ?? 0,
    statusCounts: summaryRow ?? { active: 0, deactivated: 0, unverified: 0, all: 0 },
  };
};
