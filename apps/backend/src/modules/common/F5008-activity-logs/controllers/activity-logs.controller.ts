import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import {
  getActivityLogsService,
  getUserActivityLogsService,
  getRecordActivityLogsService,
  ActivityLogFilters,
} from "../services/activity-logs.service";
import { z } from "zod";

// Validation schemas
const getActivityLogsSchema = z.object({
  tableName: z.string().optional(),
  recordId: z.string().optional(),
  userId: z.uuid().optional(),
  operationType: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
  startDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  limit: z
    .string()
    .transform(Number)
    .refine((n) => n > 0 && n <= 100)
    .optional(),
  offset: z
    .string()
    .transform(Number)
    .refine((n) => n >= 0)
    .optional(),
});

const recordActivityLogsSchema = z.object({
  tableName: z.string().min(1, "Table name is required"),
  recordId: z.string().min(1, "Record ID is required"),
});

/**
 * GET /api/activity-logs - Get activity logs with filtering
 */
export const getActivityLogsController = asyncHandler(
  async (req: Request, res: Response) => {
    const filters = getActivityLogsSchema.parse(
      req.query,
    ) as ActivityLogFilters;

    const result = await getActivityLogsService(filters);

    res.status(200).json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: {
        logs: result.logs,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        filters: filters,
      },
    });
  },
);

/**
 * GET /api/activity-logs/user/:userId - Get activity logs for a specific user
 */
export const getUserActivityLogsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const result = await getUserActivityLogsService(userId, limit, offset);

    res.status(200).json({
      success: true,
      message: "User activity logs retrieved successfully",
      data: {
        logs: result.logs,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        userId: userId,
      },
    });
  },
);

/**
 * GET /api/activity-logs/record - Get activity logs for a specific record
 */
export const getRecordActivityLogsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { tableName, recordId } = recordActivityLogsSchema.parse(req.query);

    const logs = await getRecordActivityLogsService(tableName, recordId);

    res.status(200).json({
      success: true,
      message: "Record activity logs retrieved successfully",
      data: {
        logs: logs,
        totalCount: logs.length,
        tableName: tableName,
        recordId: recordId,
      },
    });
  },
);
