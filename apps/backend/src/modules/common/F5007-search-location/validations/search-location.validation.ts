import {
    commonSearchStatesSchema,
    commonSearchCitiesSchema,
} from "@repo/schemas-types/payload-schemas/common/search-location/payload.schema";
import type {
    CommonSearchStatesPayload,
    CommonSearchCitiesPayload,
} from "@repo/schemas-types/payload-schemas/common/search-location/payload.schema";

export const searchStatesValidationSchema = commonSearchStatesSchema;
export const searchCitiesValidationSchema = commonSearchCitiesSchema;

export type SearchStatesValidationType = CommonSearchStatesPayload;
export type SearchCitiesValidationType = CommonSearchCitiesPayload;
