import { z } from "zod";

export const appStatesSchema = z.object({
    id: z.uuid(),
    name: z.string().max(200),
    countryId: z.uuid(),
    latitude: z.string().nullable().optional(),
    longitude: z.string().nullable().optional(),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
});

export type AppStates = z.infer<typeof appStatesSchema>;
