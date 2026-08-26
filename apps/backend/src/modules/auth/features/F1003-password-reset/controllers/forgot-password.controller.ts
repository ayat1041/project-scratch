import { validateZodSchema } from "@/middleware/validation.middleware";
import { Request, Response } from "express";
import { encrypt, JwtSignPayload } from "@/lib/auth.utils";
import { onResetPasswordVerificationEmail } from "@/data/emails/auth-email-contents.template";
import {
  FRONTEND_URL,
  FORGOT_PASSWORD_TOKEN_AGE,
  FORGOT_PASSWORD_TOKEN_COOKIE_MAX_AGE,
  ADMIN_DASHBOARD_URL,
} from "@/constants/variables";
import { eventPublisher } from "@/infrastructure/events/event-publisher";
import { ROUTING_KEYS } from "@/constants/routing-keys";
import { EmailJob } from "@/infrastructure/events/email-job.types";
import { logger } from "@/infrastructure/monitoring/logger";
import { asyncHandler } from "@/utils/async-handler";
import type { ForgotPasswordResponse } from "@repo/schemas-types/payload-schemas/auth/Response.type";
import { ForgotPasswordRequestPayloadValidationSchema } from "@repo/schemas-types/payload-schemas/auth/Payload.schema";
import { deleteAndInsertEmailVerificationToken } from "@/modules/auth/features/shared/services/delete-and-insert-verification-token.service";
import { getUserByEmailWithRolesAndPermissions } from "@/domain/users/models/users/users.queries";
import { getSiteContext } from "@/middleware/authentication.middleware";
import { PERMISSIONS } from "@repo/constants";

export const forgotPasswordRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = validateZodSchema(
      ForgotPasswordRequestPayloadValidationSchema,
    )(req.body);
    const requestSiteContext = getSiteContext(req);
    const userInfo = await getUserByEmailWithRolesAndPermissions(email);

    if (userInfo?.isVerified) {
      const { id: userId } = userInfo;
      const resetBaseUrl = userInfo.permissions.includes(
        PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      )
        ? ADMIN_DASHBOARD_URL
        : FRONTEND_URL;

      // Sending verification email with link
      const payload: JwtSignPayload = { email: email };

      const verificationToken = await encrypt(
        payload,
        FORGOT_PASSWORD_TOKEN_AGE,
      );

      // Store the verification token in database with expiration
      const expiresAt = new Date(
        Date.now() + FORGOT_PASSWORD_TOKEN_COOKIE_MAX_AGE,
      );

      // Manage email verification token (delete existing and create new)
      await deleteAndInsertEmailVerificationToken({
        userId,
        token: verificationToken,
        expiresAt,
      });

      // Generate verification link
      const verificationLink = `${resetBaseUrl}/auth/reset-password?token=${verificationToken}&email=${encodeURIComponent(email)}`;

      const emailData: EmailJob = {
        from: `${process.env.EMAIL_FROM}`,
        to: email,
        subject: "Reset your password",
        html: onResetPasswordVerificationEmail({
          email,
          verificationLink,
        }),
      };

      try {
        await eventPublisher.publish(
          ROUTING_KEYS.NOTIFICATION_EMAIL_SEND,
          emailData,
        );
      } catch (error) {
        logger.error("Failed to publish password reset email", { error });
      }
    }

    const baseResponse: ForgotPasswordResponse = {
      success: true,
      message:
        "If an account exists for that email, a password reset link will be sent.",
      _links: {
        redirectUrl:
          requestSiteContext === "main"
            ? FRONTEND_URL + "/auth/forgot-password"
            : ADMIN_DASHBOARD_URL + "/auth/forgot-password",
      },
    };

    res.status(200).json(baseResponse);
  },
);
