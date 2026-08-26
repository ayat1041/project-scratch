import { db } from "@/db/db";
import { appActivityLogsTable, appUsersTable } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import type {
  AppActivityLogs,
  AppUsers,
} from "@repo/schemas-types/tables/entity-types";

export interface ActivityLogFilters {
  tableName?: string;
  recordId?: string;
  userId?: string;
  operationType?: "CREATE" | "UPDATE" | "DELETE";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ActivityLogEntry {
  id: NonNullable<AppActivityLogs["id"]>;
  tableName: NonNullable<AppActivityLogs["tableName"]>;
  recordId: NonNullable<AppActivityLogs["recordId"]>;
  operationType: NonNullable<AppActivityLogs["operationType"]>;
  userId: NonNullable<AppActivityLogs["userId"]>;
  userName: Exclude<AppUsers["userName"], undefined> | null;
  oldValues: AppActivityLogs["oldValues"];
  newValues: AppActivityLogs["newValues"];
  changedFields: AppActivityLogs["changedFields"];
  description: Exclude<AppActivityLogs["description"], undefined>;
  ipAddress: Exclude<AppActivityLogs["ipAddress"], undefined>;
  userAgent: Exclude<AppActivityLogs["userAgent"], undefined>;
  createdAt: NonNullable<AppActivityLogs["createdAt"]>;
}

export interface ActivityLogsResponse {
  logs: ActivityLogEntry[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Service to retrieve activity logs with filtering and pagination
 */
export const getActivityLogsService = async (
  filters: ActivityLogFilters = {},
): Promise<ActivityLogsResponse> => {
  const {
    tableName,
    recordId,
    userId,
    operationType,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  // Build where conditions
  const whereConditions = [];

  if (tableName) {
    whereConditions.push(eq(appActivityLogsTable.tableName, tableName));
  }

  if (recordId) {
    whereConditions.push(eq(appActivityLogsTable.recordId, recordId));
  }

  if (userId) {
    whereConditions.push(eq(appActivityLogsTable.userId, userId));
  }

  if (operationType) {
    whereConditions.push(eq(appActivityLogsTable.operationType, operationType));
  }

  if (startDate) {
    whereConditions.push(gte(appActivityLogsTable.createdAt, startDate));
  }

  if (endDate) {
    whereConditions.push(lte(appActivityLogsTable.createdAt, endDate));
  }

  // Query logs with user information
  const logs = await db
    .select({
      id: appActivityLogsTable.id,
      tableName: appActivityLogsTable.tableName,
      recordId: appActivityLogsTable.recordId,
      operationType: appActivityLogsTable.operationType,
      userId: appActivityLogsTable.userId,
      userName: appUsersTable.userName,
      oldValues: appActivityLogsTable.oldValues,
      newValues: appActivityLogsTable.newValues,
      changedFields: appActivityLogsTable.changedFields,
      description: appActivityLogsTable.description,
      ipAddress: appActivityLogsTable.ipAddress,
      userAgent: appActivityLogsTable.userAgent,
      createdAt: appActivityLogsTable.createdAt,
    })
    .from(appActivityLogsTable)
    .leftJoin(appUsersTable, eq(appActivityLogsTable.userId, appUsersTable.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(appActivityLogsTable.createdAt))
    .limit(limit + 1) // Get one extra to check if there are more
    .offset(offset);

  // Separate the extra record to check if there are more
  const hasMore = logs.length > limit;
  const resultLogs = hasMore ? logs.slice(0, limit) : logs;

  return {
    // jsonb columns are typed `unknown` by Drizzle but modeled as JSON object maps by the Zod table schema.
    logs: resultLogs as ActivityLogEntry[],
    totalCount: resultLogs.length,
    hasMore,
  };
};

/**
 * Get activity logs for a specific record
 */
export const getRecordActivityLogsService = async (
  tableName: string,
  recordId: string,
): Promise<ActivityLogEntry[]> => {
  const result = await getActivityLogsService({
    tableName,
    recordId,
    limit: 100, // Get more for a specific record
  });

  return result.logs;
};

/**
 * Get activity logs for a specific user
 */
export const getUserActivityLogsService = async (
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<ActivityLogsResponse> => {
  return await getActivityLogsService({
    userId,
    limit,
    offset,
  });
};
