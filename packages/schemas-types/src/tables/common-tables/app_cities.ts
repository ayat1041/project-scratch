import { z } from "zod";

export const appCitiesSchema = z.object({
    id: z.uuid(),
    name: z.string().max(200),
    stateId: z.uuid(),
    countryId: z.uuid(),
    latitude: z.string().nullable().optional(),
    longitude: z.string().nullable().optional(),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
});

export type AppCities = z.infer<typeof appCitiesSchema>;
