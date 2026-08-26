import { Request, Response } from "express";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { encrypt, JwtSignPayload } from "@/lib/auth.utils";
import {
  FRONTEND_URL,
  IS_PRODUCTION,
  VERIFICATION_TOKEN_AGE,
  VERIFICATION_TOKEN_COOKIE_MAX_AGE,
} from "@/constants/variables";
import { onRegisterVerificationEmail } from "@/data/emails/auth-email-contents.template";
import { eventPublisher } from "@/infrastructure/events/event-publisher";
import { ROUTING_KEYS } from "@/constants/routing-keys";
import { EmailJob } from "@/infrastructure/events/email-job.types";
import { logger } from "@/infrastructure/monitoring/logger";
import { asyncHandler } from "@/utils/async-handler";
import type { ResendVerificationResponse } from "@repo/schemas-types/payload-schemas/auth/Response.type";
import { ResendEmailVerificationPayloadValidationSchema } from "@repo/schemas-types/payload-schemas/auth/Payload.schema";
import { checkUserIsVerifiedOrNotService } from "@/domain/users/services/check-user-exists-or-not.service";
import { deleteAndInsertEmailVerificationToken } from "@/modules/auth/features/shared/services/delete-and-insert-verification-token.service";

export const resendEmailVerificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, role } = validateZodSchema(
      ResendEmailVerificationPayloadValidationSchema,
    )(req.body);

    // Check if user exists using CQRS query pattern
    const userInfo = await checkUserIsVerifiedOrNotService(email, "verified");

    // Sending verification email with link
    const payload: JwtSignPayload = { email, role };
    const verificationToken = await encrypt(payload, VERIFICATION_TOKEN_AGE);

    // update the verification token in database with expiration
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_COOKIE_MAX_AGE);

    await deleteAndInsertEmailVerificationToken({
      userId: userInfo.id,
      token: verificationToken,
      role,
      expiresAt,
    });

    // Generate verification link
    const verificationLink = `${FRONTEND_URL}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const emailData: EmailJob = {
      from: `${process.env.EMAIL_FROM}`,
      to: email,
      subject: "Email Verification",
      html: onRegisterVerificationEmail({
        email,
        verificationLink,
        name: userInfo.userName,
      }),
    };

    try {
      await eventPublisher.publish(
        ROUTING_KEYS.NOTIFICATION_EMAIL_SEND,
        emailData,
      );
    } catch (error) {
      logger.error("Failed to publish resend verification email", { error });
    }

    const baseResponse: ResendVerificationResponse = {
      success: true,
      message: "Verification link sent to your email. Please check your inbox.",
      ...(!IS_PRODUCTION && { verificationLink }),
      _links: {
        redirectUrl: "",
      },
    };

    res.status(200).json(baseResponse);
  },
);
