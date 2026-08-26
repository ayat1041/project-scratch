import { Request, Response } from "express";
import { createError } from "@/middleware/error.middleware";
import { getCitiesService } from "@/modules/common/F5003-cities/services/get-cities.service";
import { validateIncomingRequests } from "@/utils/validation-function.utils";
import { appCitiesTable } from "@/db/schema";
import { incomingRequestValidationSchema } from "@repo/schemas-types/payload-schemas/common/payload.schema";
import { z } from "zod";
import { getTableColumns } from "drizzle-orm";
import { asyncHandler } from "@/utils/async-handler";

// extend the base list-query schema with a city-specific stateId filter
const citiesValidationSchema = incomingRequestValidationSchema(
  Object.keys(appCitiesTable),
).extend({
  stateId: z.uuid().optional(),
});

// GET - Fetch all cities with optional filtering and pagination
export const getCitiesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = res?.locals?.userId;
    if (!userId) {
      throw createError.unauthorized("Unauthorized", {
        error: "User does not exist",
        hint: "Please authenticate first",
      });
    }

    const allowedCityFields = Object.keys(getTableColumns(appCitiesTable));
    const validatedRequestData = await validateIncomingRequests([
      ...allowedCityFields,
    ])(req);

    // validate categoryId separately
    const stateIdValidation = citiesValidationSchema.safeParse({
      stateId: req.query.stateId,
    });

    if (!stateIdValidation.success) {
      const errorMessage = stateIdValidation.error.issues
        .map((err) => err.message)
        .join(", ");
      throw createError.validation(errorMessage);
    }

    // const { offset, limit, categoryId, search } = req.query;
    const { limit, offset, search, fields, sortField, sortOrder, countTotal } =
      validatedRequestData;

    const stateId = stateIdValidation.data.stateId;

    const citiesResult = await getCitiesService({
      offset,
      limit,
      search,
      stateId,
      fields,
      sortField,
      sortOrder,
      countTotal,
    });

    res.status(200).json(citiesResult);
  },
);
