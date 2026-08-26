import { z } from "zod";

export const appTimezonesSchema = z.object({
    id: z.uuid(),
    name: z.string().max(100),
    utcOffset: z.string().max(10),
    label: z.string().max(150),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
});

export type AppTimezones = z.infer<typeof appTimezonesSchema>;
