import { z } from "zod";

export const appPermissionsRolesSchema = z.object({
    permissionId: z.number().int().nullable().optional(),
    roleId: z.number().int().nullable().optional(),
});

export type AppPermissionsRoles = z.infer<typeof appPermissionsRolesSchema>;
