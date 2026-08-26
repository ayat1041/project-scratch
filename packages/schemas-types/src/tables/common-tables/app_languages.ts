import { z } from "zod";

export const appLanguagesSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().toLowerCase().max(100),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
});

export type AppLanguages = z.infer<typeof appLanguagesSchema>;
