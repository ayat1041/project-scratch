import { z } from "zod";

export const appCountriesSchema = z.object({
    id: z.uuid(),
    name: z.string().max(100),
    iso3: z.string().max(3),
    iso2: z.string().max(2),
    phoneCode: z.string().max(20).nullable().optional(),
    capital: z.string().max(100).nullable().optional(),
    currency: z.string().max(50).nullable().optional(),
    region: z.string().max(100).nullable().optional(),
    subregion: z.string().max(100).nullable().optional(),
    latitude: z.string().nullable().optional(),
    longitude: z.string().nullable().optional(),
    emoji: z.string().max(10).nullable().optional(),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
});

export type AppCountries = z.infer<typeof appCountriesSchema>;
