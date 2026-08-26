import { z } from "zod";

export const appUserRolesSchema = z.object({
    userId: z.uuid(),
    roleId: z.number().int(),
    assignedAt: z.date(),
});

export type AppUserRoles = z.infer<typeof appUserRolesSchema>;
