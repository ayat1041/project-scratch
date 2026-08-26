import { z } from "zod";

export const appPermissionsSchema = z.object({
    id: z.number().int(),
    name: z.string().trim().toLowerCase().min(3, "Name should be at least 3 characters").max(91, "Name should be at most 91 characters"),
    description: z.string().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type AppPermissions = z.infer<typeof appPermissionsSchema>;
