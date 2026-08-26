import { z } from "zod";

export const appUsersSchema = z.object({
    id: z.uuid(),
    email: z.string().trim().toLowerCase().max(255).check(z.email({ message: "Invalid email address" })),
    password: z.string().trim().max(64),
    isVerified: z.boolean(),
    isDeleted: z.boolean(),
    registeredAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
    providerName: z.string().max(90),
    /** How this account was created — see `USER_ORIGIN_TYPES` in `@repo/constants`. */
    userOrigin: z.string().max(50),
    /** ID of the admin who created this account, when `userOrigin` is `admin_created`. */
    invitedBy: z.uuid().nullable().optional(),
    userName: z.string()
        .trim()
        .min(3, 'Username must be 3–100 lowercase characters.')
        .max(100, 'Username must be 3–100 lowercase characters.')
        .regex(/^[a-z0-9-]+$/, 'Username may only contain lowercase letters, numbers, and hyphens.'),
    userNameUpdatedAt: z.date().nullable().optional(),
    profileImage: z.string().max(500).nullable().optional(),
});

export type AppUsers = z.infer<typeof appUsersSchema>;
