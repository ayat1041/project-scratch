import { z } from "zod";
import {
    SiteSeoSettingsDraftPayloadValidationSchema,
} from "./payload.schema";

export const SiteSeoSettingsVersionResponseSchema = SiteSeoSettingsDraftPayloadValidationSchema.extend({
    id: z.uuid(),
    versionNumber: z.number().int(),
    status: z.enum(["draft", "published", "archived"]),
    publishedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});
export type SiteSeoSettingsVersionResponseType = z.infer<typeof SiteSeoSettingsVersionResponseSchema>;

export interface SiteSeoSettingsVersionSummaryType {
    id: string;
    versionNumber: number;
    status: "draft" | "published" | "archived";
    publishedAt: string | null;
    createdAt: string;
}
