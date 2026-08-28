import { z } from "zod";

export const appSeoPagesSchema = z.object({
    id: z.uuid(),
    path: z.string().min(1).max(500),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
});

export type AppSeoPages = z.infer<typeof appSeoPagesSchema>;
