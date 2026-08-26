import { validateZodSchema } from "@/middleware/validation.middleware";
import { Request, Response } from "express";
import { encrypt, JwtSignPayload } from "@/lib/auth.utils";
import { onRegisterVerificationEmail } from "@/data/emails/auth-email-contents.template";
import { ERROR_TYPES, createError } from "@/middleware/error.middleware";
import {
  IS_PRODUCTION,
  VERIFICATION_TOKEN_COOKIE_MAX_AGE,
  VERIFICATION_TOKEN_AGE,
  FRONTEND_URL,
} from "@/constants/variables";
import { eventPublisher } from "@/infrastructure/events/event-publisher";
import { ROUTING_KEYS } from "@/constants/routing-keys";
import { EmailJob } from "@/infrastructure/events/email-job.types";
import { logger } from "@/infrastructure/monitoring/logger";
import { asyncHandler } from "@/utils/async-handler";
import type { SignupResponse } from "@repo/schemas-types/payload-schemas/auth/Response.type";
import { getRoleByTitle } from "@/domain/users/models/roles.queries";
import { SignupPayloadValidationSchema } from "@repo/schemas-types/payload-schemas/auth/Payload.schema";
import { ERROR_MESSAGES } from "@/constants/messages";
import { getOrCreateUserOnSignUp } from "@/modules/auth/features/F1001-signup/services/get-or-create-user-on-signup.service";
import { deleteAndInsertEmailVerificationToken } from "@/modules/auth/features/shared/services/delete-and-insert-verification-token.service";
import { SELF_REGISTRABLE_ROLES } from "@repo/constants";

const SIGNUP_PUBLIC_MESSAGE =
  "If the signup details are eligible, a verification link will be sent to your email.";

const isConflictError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "type" in error &&
  (error as { type?: unknown }).type === ERROR_TYPES.CONFLICT;

const buildSignupResponse = ({
  verificationLink,
}: {
  verificationLink?: string;
}): SignupResponse => ({
  success: true,
  message: SIGNUP_PUBLIC_MESSAGE,
  ...(!IS_PRODUCTION && verificationLink && { verificationLink }),
  _links: {
    redirectUrl: "",
  },
});

export const signupController = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password, role } = validateZodSchema(
      SignupPayloadValidationSchema,
    )(req.body);

    // Validate role exists and get role ID
    const roleId = await getRoleByTitle(role);

    if (!SELF_REGISTRABLE_ROLES.includes(role)) {
      throw createError.badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG, {
        error: `User attempting to sign up with role: ${role}. Allowed roles: ${SELF_REGISTRABLE_ROLES.join(
          ", ",
        )}`,
      });
    }

    // Check for disposable/temporary email addresses
    // const isDisposableEmail = await checkDisposableEmail(email);
    // if (isDisposableEmail) {
    //   throw {
    //     type: ERROR_TYPES.VALIDATION,
    //     message: "Please use a valid business or personal email address",
    //     details: {
    //       error:
    //         "Disposable or temporary email addresses are not allowed for registration",
    //     },
    //   };
    // }

    // Get existing unverified user or create new user
    let userInfo: Awaited<ReturnType<typeof getOrCreateUserOnSignUp>>;
    try {
      userInfo = await getOrCreateUserOnSignUp(email, password, name, roleId);
    } catch (error) {
      if (isConflictError(error)) {
        res.status(200).json(buildSignupResponse({}));
        return;
      }

      throw error;
    }
    // Sending verification email with link
    const payload: JwtSignPayload = { email: email, role: role };
    const verificationToken = await encrypt(payload, VERIFICATION_TOKEN_AGE);

    // Store the verification token in database with expiration
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_COOKIE_MAX_AGE);

    // Manage email verification token (delete existing and create new)
    await deleteAndInsertEmailVerificationToken({
      userId: userInfo.id!,
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
        name: name,
      }),
    };

    try {
      await eventPublisher.publish(
        ROUTING_KEYS.NOTIFICATION_EMAIL_SEND,
        emailData,
      );
    } catch (error) {
      logger.error("Failed to publish signup verification email", { error });
    }

    res.status(200).json(buildSignupResponse({ verificationLink }));
  },
);
