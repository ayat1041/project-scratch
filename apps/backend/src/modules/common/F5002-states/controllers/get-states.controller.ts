import { Request, Response } from "express";
import { getStatesService } from "@/modules/common/F5002-states/services/get-states.service";
import { validateIncomingRequests } from "@/utils/validation-function.utils";
import { appStatesTable } from "@/db/schema";
import { z } from "zod";
import { getTableColumns } from "drizzle-orm";
import { incomingRequestValidationSchema } from "@repo/schemas-types/payload-schemas/common/payload.schema";
import { createError } from "@/middleware/error.middleware";
import { asyncHandler } from "@/utils/async-handler";

// extend the base list-query schema with a state-specific countryId filter
const statesValidationSchema = incomingRequestValidationSchema(
  Object.keys(appStatesTable),
).extend({
  countryId: z.coerce.number().int().positive().optional(),
});

// GET - Fetch all states with optional filtering and pagination
export const getStatesController = asyncHandler(
  async (req: Request, res: Response) => {
    const allowedStateFields = Object.keys(getTableColumns(appStatesTable));
    const validatedRequestData = await validateIncomingRequests([
      ...allowedStateFields,
    ])(req);

    // validate categoryId separately
    const countryIdValidation = statesValidationSchema.safeParse({
      countryId: req.query.countryId,
    });

    if (!countryIdValidation.success) {
      const errorMessage = countryIdValidation.error.issues
        .map((err) => err.message)
        .join(", ");
      throw createError.validation(errorMessage);
    }

    // const { offset, limit, categoryId, search } = req.query;
    const { limit, offset, search, fields, sortField, sortOrder, countTotal } =
      validatedRequestData;

    const countryId = countryIdValidation.data.countryId;

    const statesResult = await getStatesService({
      offset,
      limit,
      search,
      countryId: countryId?.toString(),
      fields,
      sortField,
      sortOrder,
      countTotal,
    });

    res.status(200).json({
      statesResult,
    });
  },
);
