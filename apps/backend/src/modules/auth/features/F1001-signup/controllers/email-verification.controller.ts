import { validateZodSchema } from "@/middleware/validation.middleware";
import { appEmailVerificationTokensTable, appUsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { Request, Response } from "express";
import { decryptToken } from "@/lib/auth.utils";
import { createError } from "@/middleware/error.middleware";
import { createSession } from "@/lib/session-auth.utils";
import { FRONTEND_URL } from "@/constants/variables";
import { asyncHandler } from "@/utils/async-handler";

import type {
  EmailVerificationResponse,
  UserInfoPayload,
} from "@repo/schemas-types/payload-schemas/auth/Response.type";
import { EmailVerificationPayloadValidationSchema } from "@repo/schemas-types/payload-schemas/auth/Payload.schema";
import { getAllowedRoutes, ROUTES } from "@repo/constants";
import { checkTokenExistsOrExpiresService } from "@/domain/users/services/check-verification-exists-expires.service";
import { checkUserIsVerifiedOrNotService } from "@/domain/users/services/check-user-exists-or-not.service";
import { ERROR_MESSAGES } from "@/constants/messages";

export const emailVerificationController = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate input - can come from query params or body
    const { token, email } = validateZodSchema(
      EmailVerificationPayloadValidationSchema,
    )({
      token: req.body.token,
      email: req.body.email,
    });

    // Verify and decrypt the token

    const decryptedData = await decryptToken(token);

    // Verify email matches the token
    if (decryptedData.email !== email) {
      throw createError.badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG, {
        error: "The verification token does not match the provided email",
        hint: "Please use the correct verification link from your email.",
      });
    }

    // Get user verification info (includes role validation)
    const userInfo = await checkUserIsVerifiedOrNotService(email, "verified");
    // Validate role matches token
    if (!userInfo.roles.includes(decryptedData.role)) {
      throw createError.validation(ERROR_MESSAGES.SOMETHING_WENT_WRONG, {
        error: "The verification token role does not match user's role",
        hint: "Please contact support for assistance.",
      });
    }

    // Validate verification token
    const tokenValidation = await checkTokenExistsOrExpiresService(
      userInfo.id,
      token,
    );

    // Verify the user and consume the token atomically.
    await db.transaction(async (tx) => {
      const consumedToken = await tx
        .delete(appEmailVerificationTokensTable)
        .where(eq(appEmailVerificationTokensTable.id, tokenValidation.tokenId))
        .returning({ tokenId: appEmailVerificationTokensTable.id });

      if (consumedToken.length === 0) {
        throw createError.validation(ERROR_MESSAGES.SOMETHING_WENT_WRONG, {
          error: "Invalid or already used verification token",
        });
      }

      // Update user as verified
      await tx
        .update(appUsersTable)
        .set({
          isVerified: true,
        })
        .where(eq(appUsersTable.id, userInfo.id));
    });

    const userInfoPayload: UserInfoPayload = {
      id: userInfo.id,
      email: userInfo.email,
      userName: userInfo.userName,
      profileImage: userInfo.profileImage,
      providerName: userInfo.providerName,
      isVerified: userInfo.isVerified,
      isDeleted: userInfo.isDeleted,
      registeredAt: userInfo.registeredAt,
      roles: userInfo.roles,
      activeRole: userInfo.roles[0] ?? null,
      permissions: userInfo.permissions,
      allowedRoutes: getAllowedRoutes(ROUTES.USER, userInfo.permissions ?? []),
    };

    // Create session using the single-token approach
    await createSession(res, userInfo.id, userInfo.email, req);

    const baseResponse: EmailVerificationResponse = {
      success: true,
      message: "Email verified successfully",
      data: { userInfo: userInfoPayload },
      _links: {
        redirectUrl: `${FRONTEND_URL}${ROUTES.USER.WELCOME.href}`,
      },
    };

    res.status(200).json(baseResponse);
  },
);
