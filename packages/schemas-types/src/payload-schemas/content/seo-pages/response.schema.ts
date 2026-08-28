import { z } from "zod";
import { SeoPageDraftPayloadValidationSchema } from "./payload.schema";

export const SeoPageVersionResponseSchema = SeoPageDraftPayloadValidationSchema.extend({
    id: z.uuid(),
    pageId: z.uuid(),
    versionNumber: z.number().int(),
    status: z.enum(["draft", "published", "archived"]),
    publishedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});
export type SeoPageVersionResponseType = z.infer<typeof SeoPageVersionResponseSchema>;

export interface SeoPageListItemResponseType {
    id: string;
    path: string;
    latestStatus: "draft" | "published" | "archived" | "none";
    publishedTitle: string | null;
    updatedAt: string;
}

export interface SeoPageDetailResponseType {
    id: string;
    path: string;
    createdAt: string;
    updatedAt: string;
    draft: SeoPageVersionResponseType | null;
    published: SeoPageVersionResponseType | null;
}
