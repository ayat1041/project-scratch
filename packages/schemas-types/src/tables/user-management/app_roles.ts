import { z } from "zod";

export const appRolesSchema = z.object({
    id: z.number().int(),
    name: z.string().trim().toLowerCase().min(3, "Name should be at least 3 characters").max(91, "Name should be at most 91 characters"),
    description: z.string().nullable().optional(),
    scope: z.string().max(50),
    isSystemRole: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type AppRoles = z.infer<typeof appRolesSchema>;
