import { Request, Response } from "express";
import { getLanguagesService } from "@/modules/common/F5004-languages/services/get-languages.service";
import { validateIncomingRequests } from "@/utils/validation-function.utils";
import { getTableColumns } from "drizzle-orm";
import { appLanguagesTable } from "@/db/schema";
import { asyncHandler } from "@/utils/async-handler";

// GET - Fetch languages with pagination and optional search
export const getLanguagesController = asyncHandler(
  async (req: Request, res: Response) => {
    const allowedLanguageFields = Object.keys(
      getTableColumns(appLanguagesTable),
    );
    const validatedRequestData = await validateIncomingRequests(
      allowedLanguageFields,
    )(req);

    const { limit, offset, search, fields, sortField, sortOrder, countTotal } =
      validatedRequestData;

    // get languages
    const languagesResult = await getLanguagesService({
      offset,
      limit,
      search,
      fields,
      sortField,
      sortOrder,
      countTotal,
    });

    res.status(200).json(languagesResult);
  },
);
