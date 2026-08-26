import { Request, Response } from "express";
import { getCountriesService } from "@/modules/common/F5001-countries/services/get-countries.service";
import { validateIncomingRequests } from "@/utils/validation-function.utils";
import { getTableColumns } from "drizzle-orm";
import { appCountriesTable } from "@/db/schema";
import { asyncHandler } from "@/utils/async-handler";

// GET - Fetch countries with pagination and optional search
export const getCountriesController = asyncHandler(
  async (req: Request, res: Response) => {
    const allowedCountryFields = Object.keys(getTableColumns(appCountriesTable));

    const validatedRequestData =
      await validateIncomingRequests(allowedCountryFields)(req);

    const { limit, offset, search, fields, sortField, sortOrder, countTotal } =
      validatedRequestData;
    // get countries
    const countriesResult = await getCountriesService({
      offset,
      limit,
      search,
      fields,
      sortField,
      sortOrder,
      countTotal,
    });

    res.status(200).json(countriesResult);
  },
);
