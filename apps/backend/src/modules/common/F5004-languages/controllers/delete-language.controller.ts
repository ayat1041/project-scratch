import { Request, Response } from "express";
import { handleError } from "@/middleware/error.middleware";
import { AdminLanguageIdParamSchema } from "@repo/schemas-types/payload-schemas/admin/languages/payload.schema";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { deleteLanguageService } from "@/modules/common/F5004-languages/services/delete-language.service";

// DELETE - Remove a language by ID
export const deleteLanguageController = async (req: Request, res: Response) => {
  try {
    const validatedParams = await validateZodSchema(AdminLanguageIdParamSchema)(
      req.params,
    );

    const { id } = validatedParams as { id: string };

    const deleteResult = await deleteLanguageService(id);

    res.status(200).json(deleteResult);
  } catch (error) {
    handleError(
      error,
      res,
      "deleteLanguageController - /api/common/v1/languages",
    );
  }
};
