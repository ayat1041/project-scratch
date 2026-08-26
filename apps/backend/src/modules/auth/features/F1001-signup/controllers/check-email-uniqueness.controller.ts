import z from "zod";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { Request, Response } from "express";

import { asyncHandler } from "@/utils/async-handler";
import { checkUserExistsByEmail } from "@/domain/users/models/users/users.queries";
import type { UniquenessCheckResponse } from "@repo/schemas-types/payload-schemas/auth/Response.type";

export const checkEmailUniquenessController = asyncHandler(
  async (req: Request, res: Response) => {
    const email = validateZodSchema(
      z
        .string()
        .trim()
        .email()
        .transform((val) => val.toLowerCase()),
    )(req.body.email);

    const existingUser = await checkUserExistsByEmail(email);
    const isUnique = !existingUser?.isVerified;

    const baseResponse: UniquenessCheckResponse = {
      success: true,
      message: isUnique ? "Available" : "Not available",
      data: { isUnique },
    };

    res.status(200).json(baseResponse);
  },
);
