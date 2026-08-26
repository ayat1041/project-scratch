import { Request, Response } from "express";
import { handleError } from "@/middleware/error.middleware";
import { AdminCreateLanguagePayloadValidationSchema } from "@repo/schemas-types/payload-schemas/admin/languages/payload.schema";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { createLanguageService } from "@/modules/common/F5004-languages/services/create-language.service";

// CREATE - Add a new language
export const createLanguageController = async (req: Request, res: Response) => {
  try {
    const validatedBody = await validateZodSchema(
      AdminCreateLanguagePayloadValidationSchema,
    )(req.body);

    const { name } = validatedBody;

    const createLanguageResult = await createLanguageService(name);

    res.status(201).json(createLanguageResult);
  } catch (error) {
    handleError(
      error,
      res,
      "createLanguageController - /api/common/v1/languages",
    );
  }
};
