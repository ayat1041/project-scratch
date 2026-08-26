import { z } from "zod";

export const appEmailVerificationTokensSchema = z.object({
    id: z.uuid(),
    userId: z.uuid(),
    token: z.string(),
    expiresAt: z.date(),
    role: z.string().max(50).nullable().optional(),
    createdAt: z.date(),
});

export type AppEmailVerificationTokens = z.infer<typeof appEmailVerificationTokensSchema>;
