import { z } from "zod";

export const appActivityLogsSchema = z.object({
    id: z.uuid(),
    tableName: z.string().max(100),
    recordId: z.string().max(255),
    operationType: z.string().max(20),
    userId: z.uuid(),
    oldValues: z.unknown().nullable().optional(),
    newValues: z.unknown().nullable().optional(),
    changedFields: z.unknown().nullable().optional(),
    source: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    ipAddress: z.string().max(45).nullable().optional(),
    userAgent: z.string().nullable().optional(),
    createdAt: z.date(),
});

export type AppActivityLogs = z.infer<typeof appActivityLogsSchema>;
