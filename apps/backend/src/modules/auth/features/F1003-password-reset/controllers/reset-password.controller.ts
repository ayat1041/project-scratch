import { validateZodSchema } from "@/middleware/validation.middleware";

import { Request, Response } from "express";
import { decryptToken } from "@/lib/auth.utils";
import { createError } from "@/middleware/error.middleware";
import { ADMIN_DASHBOARD_URL, FRONTEND_URL } from "@/constants/variables";
import { asyncHandler } from "@/utils/async-handler";
import {
  clearSessionCookies,
  revokeAllSessionsForUser,
} from "@/lib/session-auth.utils";

import { EmailVerificationResponse } from "@repo/schemas-types/payload-schemas/auth/Response.type";

import { ResetPasswordPayloadValidationSchema } from "@repo/schemas-types/payload-schemas/auth/Payload.schema";
import { checkUserIsVerifiedOrNotService } from "@/domain/users/services/check-user-exists-or-not.service";
import { checkTokenExistsOrExpiresService } from "@/domain/users/services/check-verification-exists-expires.service";
import { updateUserPassword } from "@/domain/users/models/users/users.commands";
import { deleteVerificationTokenByUserId } from "@/domain/users/models/users-email-verification/email-verification.commands";
import { validateSiteContextForUser } from "@/modules/auth/auth.utils";
import { ResetPasswordPayloadValidationSchemaType } from "@repo/schemas-types/payload-schemas/auth/Payload.schema";

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate input - can come from query params or body
    const {
      token,
      email,
      password,
    }: ResetPasswordPayloadValidationSchemaType = validateZodSchema(
      ResetPasswordPayloadValidationSchema,
    )({
      token: req.body.token,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    // Verify and decrypt the token
    const decryptedData = await decryptToken(token);

    // Verify email matches the token
    if (decryptedData.email !== email) {
      throw createError.validation("Token and email mismatch", {
        error: "The verification token does not match the provided email",
        hint: "Please use the correct verification link from your email.",
      });
    }

    // Get user verification info (includes role validation)
    const userVerificationInfo = await checkUserIsVerifiedOrNotService(email);

    // Get complete user info with roles and permissions
    const siteContext = validateSiteContextForUser(
      req,
      userVerificationInfo.permissions,
    );

    // Validate verification token
    await checkTokenExistsOrExpiresService(userVerificationInfo.id, token);

    // update user password
    await updateUserPassword(userVerificationInfo.id, password);

    // Security: Invalidate all existing sessions after password reset
    // This ensures any compromised sessions are terminated

    await revokeAllSessionsForUser(userVerificationInfo.id);

    clearSessionCookies(res);

    // delete the used token could be implemented here
    await deleteVerificationTokenByUserId(userVerificationInfo.id);

    const baseResponse: EmailVerificationResponse = {
      success: true,
      message: "Password reset successfully",
      _links: {
        redirectUrl:
          siteContext === "main"
            ? `${FRONTEND_URL}/auth/signin`
            : `${ADMIN_DASHBOARD_URL}/auth/signin`,
      },
    };

    res.status(200).json(baseResponse);
  },
);
