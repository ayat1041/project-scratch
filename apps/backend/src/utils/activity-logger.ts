/* eslint-disable @typescript-eslint/no-explicit-any */
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { appActivityLogsTable } from "@/db/schema";

export type OperationType = "CREATE" | "UPDATE" | "DELETE";

/**
 * Recursively sorts object keys before stringifying so that key-ordering
 * differences (e.g. DB row vs freshly constructed object) don't produce
 * false positives when comparing values.
 */
const stableStringify = (value: unknown): string => {
  // Normalize Date objects to ISO string so they compare equally with
  // the ISO strings that come back from JSONB deserialization.
  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const sorted = Object.keys(value as object)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`,
      );
    return `{${sorted.join(",")}}`;
  }
  return JSON.stringify(value);
};

export type ChangedFieldsMap = Record<string, { old: unknown; new: unknown }>;

/**
 * Compares old and new record objects and returns a map of changed fields
 * with their old and new values.
 * Uses stable key-sorted stringification to avoid false positives from
 * key-ordering differences (e.g. array of objects returned from DB).
 */
export const getChangedFields = (
  oldValues: Record<string, unknown> | undefined,
  newValues: Record<string, unknown>,
): ChangedFieldsMap => {
  return Object.keys(newValues).reduce<ChangedFieldsMap>((acc, key) => {
    const oldVal = oldValues?.[key]; // ← safe access
    if (stableStringify(oldVal) !== stableStringify(newValues[key])) {
      acc[key] = { old: oldVal, new: newValues[key] };
    }
    return acc;
  }, {});
};

// Activity log data returned by services
export interface ServiceActivityLogData {
  oldValues?: any;
  newValues?: any;
  tableName: string;
  recordId: string;
  operationType: OperationType;
  description: string;
  source?: string; // Controller/endpoint that initiated this action
}

// Main activity log data interface
export interface ActivityLogData {
  tableName: string;
  recordId: string;
  operationType: OperationType;
  userId: string;
  oldValues?: Record<string, any> | any[];
  newValues?: Record<string, any> | any[];
  changedFields?: ChangedFieldsMap | null;
  description?: string;
  source?: string; // Controller/endpoint that initiated this action
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateActivityLogOptions {
  tableName: string;
  recordId: string;
  userId: string;
  newValues: Record<string, any> | any[];
  description?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateActivityLogOptions {
  tableName: string;
  recordId: string;
  userId: string;
  oldValues?: Record<string, any> | any[];
  newValues: Record<string, any> | any[];
  description?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  fieldsToLog?: Record<string, any>; // Optional field to specify which fields were intended to be updated
}

export interface DeleteActivityLogOptions {
  tableName: string;
  recordId: string;
  userId: string;
  oldValues: Record<string, any> | any[];
  description?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generic activity logging service
 */
export const logActivity = async (data: ActivityLogData): Promise<any> => {
  const result = await db
    .insert(appActivityLogsTable)
    .values({
      tableName: data.tableName,
      recordId: data.recordId,
      operationType: data.operationType,
      userId: data.userId,
      oldValues: data.oldValues || null,
      newValues: data.newValues || null,
      changedFields: data.changedFields || null,
      description: data.description || null,
      source: data.source || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    })
    .returning();
  return result[0];
};

/**
 * Log CREATE operation
 */
export const logCreateActivity = async (
  options: CreateActivityLogOptions,
): Promise<any> => {
  return await logActivity({
    tableName: options.tableName,
    recordId: options.recordId,
    operationType: "CREATE",
    userId: options.userId,
    newValues: options.newValues,
    description:
      options.description || `Created new ${options.tableName} record`,
    source: options.source,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });
};

/**
 * Log UPDATE operation
 */
export const logUpdateActivity = async (
  options: UpdateActivityLogOptions,
): Promise<any> => {
  const fieldsToCompare = Object.keys(options.fieldsToLog!).filter(
    (key) => options.fieldsToLog![key] !== undefined,
  );

  // Fetch the latest activity log for this record to use as authoritative old values
  const latestLog = await db
    .select({ newValues: appActivityLogsTable.newValues })
    .from(appActivityLogsTable)
    .where(eq(appActivityLogsTable.recordId, options.recordId))
    .orderBy(desc(appActivityLogsTable.createdAt))
    .limit(1);

  // If a previous log exists, use its newValues as the old values for accuracy;
  // otherwise fall back to the caller-supplied oldValues.
  const effectiveOldValues =
    latestLog.length > 0 && latestLog[0].newValues !== null
      ? (latestLog[0].newValues as Record<string, any>)
      : options.oldValues;

  // Compute which fields actually changed
  const changedFields =
    !Array.isArray(effectiveOldValues) && !Array.isArray(options.newValues)
      ? getChangedFields(
          effectiveOldValues as Record<string, unknown>,
          options.newValues as Record<string, unknown>,
        )
      : null;

  // filter out the fields that are not in fieldsToCompare if fieldsToCompare is not empty
  const filteredChangedFields: ChangedFieldsMap | null =
    fieldsToCompare.length > 0 && changedFields
      ? Object.keys(changedFields).reduce<ChangedFieldsMap>((acc, key) => {
          if (fieldsToCompare.includes(key)) {
            acc[key] = changedFields[key];
          }
          return acc;
        }, {})
      : changedFields;

  // Always include updatedAt if it changed, regardless of fieldsToCompare
  if (filteredChangedFields && changedFields?.updatedAt) {
    filteredChangedFields.updatedAt = changedFields.updatedAt;
  }

  return await logActivity({
    tableName: options.tableName,
    recordId: options.recordId,
    operationType: "UPDATE",
    userId: options.userId,
    oldValues: effectiveOldValues,
    newValues: options.newValues,
    changedFields: filteredChangedFields,
    description: options.description || `Updated ${options.tableName} record`,
    source: options.source,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });
};

/**
 * Log DELETE operation
 */
export const logDeleteActivity = async (
  options: DeleteActivityLogOptions,
): Promise<any> => {
  return await logActivity({
    tableName: options.tableName,
    recordId: options.recordId,
    operationType: "DELETE",
    userId: options.userId,
    oldValues: options.oldValues,
    description: options.description || `Deleted ${options.tableName} record`,
    source: options.source,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });
};

/**
 * Helper to extract IP address from request
 */
export const getClientIp = (req: any): string | undefined => {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers?.["x-real-ip"]
  );
};

/**
 * Helper to extract user agent from request
 */
export const getClientUserAgent = (req: any): string | undefined => {
  return req.headers?.["user-agent"];
};

/**
 * Helper function for controllers to log activity from service response
 */
export const logActivityFromService = async (
  serviceActivityData: ServiceActivityLogData,
  userId: string,
  req: any,
  source?: string,
): Promise<any> => {
  if (!serviceActivityData) return null;

  const operationType =
    serviceActivityData.operationType.toUpperCase() as OperationType;

  // Use source from serviceActivityData or the provided source parameter
  const finalSource = serviceActivityData.source || source;

  switch (operationType) {
    case "CREATE":
      return await logCreateActivity({
        tableName: serviceActivityData.tableName,
        recordId: serviceActivityData.recordId,
        userId: userId,
        newValues: serviceActivityData.newValues,
        description: serviceActivityData.description,
        source: finalSource,
        ipAddress: getClientIp(req),
        userAgent: getClientUserAgent(req),
      });

    case "UPDATE":
      return await logUpdateActivity({
        tableName: serviceActivityData.tableName,
        recordId: serviceActivityData.recordId,
        userId: userId,
        oldValues: serviceActivityData.oldValues,
        newValues: serviceActivityData.newValues,
        description: serviceActivityData.description,
        source: finalSource,
        ipAddress: getClientIp(req),
        userAgent: getClientUserAgent(req),
      });

    case "DELETE":
      return await logDeleteActivity({
        tableName: serviceActivityData.tableName,
        recordId: serviceActivityData.recordId,
        userId: userId,
        oldValues: serviceActivityData.oldValues,
        description: serviceActivityData.description,
        source: finalSource,
        ipAddress: getClientIp(req),
        userAgent: getClientUserAgent(req),
      });

    default:
      return null;
  }
};

/**
 * Helper function to log multiple activities from service responses
 */
export const logMultipleActivities = async (
  results: Array<{ activityLogData?: ServiceActivityLogData }>,
  userId: string,
  req: any,
  source?: string,
): Promise<void> => {
  const activityPromises = results
    .filter((result) => result.activityLogData)
    .map((result) =>
      logActivityFromService(result.activityLogData!, userId, req, source),
    );

  await Promise.all(activityPromises);

  // Clean up activity log data from results
  results.forEach((result) => {
    if (result.activityLogData) {
      delete result.activityLogData;
    }
  });
};

/**
 * Helper to generate source identifier from request path and method
 */
export const getRequestSource = (req: any): string => {
  const method = req.method?.toUpperCase() || "UNKNOWN";
  const path = req.route?.path || req.path || req.url || "unknown-path";
  return `${method} ${path}`;
};
