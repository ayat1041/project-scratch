import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { validateZodSchema } from "@/middleware/validation.middleware";
import {
    searchCitiesService,
    searchStatesService,
} from "../services/search-location.service";
import {
    searchCitiesValidationSchema,
    searchStatesValidationSchema,
} from "../validations/search-location.validation";

export const searchStatesController = asyncHandler(
    async (req: Request, res: Response) => {
        const validatedQuery = validateZodSchema(searchStatesValidationSchema)(req.query);
        const { countryId, limit = 400, isVerified = true } = validatedQuery;
        const searchQuery = validatedQuery.query ?? validatedQuery.q ?? "";
        const result = await searchStatesService({
            countryId,
            searchQuery,
            limit,
            isVerified,
        });

        res.status(200).json({
            success: true,
            message: "States retrieved successfully",
            data: result,
        });
    },
);

export const searchCitiesController = asyncHandler(
    async (req: Request, res: Response) => {
        const validatedQuery = validateZodSchema(searchCitiesValidationSchema)(req.query);
        const { countryId, stateId, limit = 400, isVerified = true } = validatedQuery;
        const searchQuery = validatedQuery.query ?? validatedQuery.q ?? "";
        const result = await searchCitiesService({
            countryId,
            stateId,
            searchQuery,
            limit,
            isVerified,
        });

        res.status(200).json({
            success: true,
            message: "Cities retrieved successfully",
            data: result,
        });
    },
);