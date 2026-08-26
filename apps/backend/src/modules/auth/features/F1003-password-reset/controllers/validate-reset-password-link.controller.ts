import { validateZodSchema } from "@/middleware/validation.middleware";

import { Request, Response } from "express";
import { decryptToken } from "@/lib/auth.utils";
import { createError } from "@/middleware/error.middleware";
import { asyncHandler } from "@/utils/async-handler";

import type { EmailVerificationResponse } from "@repo/schemas-types/payload-schemas/auth/Response.type";

import { ValidateResetPasswordLinkPayloadValidationSchema } from "@repo/schemas-types/payload-schemas/auth/Payload.schema";
import { checkUserIsVerifiedOrNotService } from "@/domain/users/services/check-user-exists-or-not.service";
import { checkTokenExistsOrExpiresService } from "@/domain/users/services/check-verification-exists-expires.service";
import { ERROR_MESSAGES } from "@/constants/messages";

export const validateResetPasswordLinkController = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate input - can come from query params or body
    const { token, email } = validateZodSchema(
      ValidateResetPasswordLinkPayloadValidationSchema,
    )({
      token: req.body.token,
      email: req.body.email,
    });

    // Verify and decrypt the token
    const decryptedData = await decryptToken(token);

    // Verify email matches the token
    if (decryptedData.email !== email) {
      throw createError.validation(ERROR_MESSAGES.SOMETHING_WENT_WRONG, {
        error: "The verification token does not match the provided email",
        hint: "Please use the correct verification link from your email.",
      });
    }

    // Get user verification info (includes role validation)
    const userVerificationInfo = await checkUserIsVerifiedOrNotService(email);

    // Validate verification token
    await checkTokenExistsOrExpiresService(userVerificationInfo.id, token);

    const baseResponse: EmailVerificationResponse = {
      success: true,
      message: "Reset password link validated successfully",
      _links: {
        redirectUrl: "",
      },
    };

    res.status(200).json(baseResponse);
  },
);
