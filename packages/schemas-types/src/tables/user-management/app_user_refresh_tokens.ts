import { z } from "zod";

export const appUserRefreshTokensSchema = z.object({
    jti: z.uuid(),
    userId: z.uuid(),
    familyId: z.uuid(),
    rotatedTo: z.uuid().nullable().optional(),
    revokedAt: z.date().nullable().optional(),
    expiresAt: z.date(),
    deviceInfo: z.string(),
    ip: z.string().max(50),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type AppUserRefreshTokens = z.infer<typeof appUserRefreshTokensSchema>;
