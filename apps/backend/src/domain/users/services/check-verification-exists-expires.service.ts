import { createError } from "@/middleware/error.middleware";
import { ERROR_MESSAGES } from "@/constants/messages";
import { findValidVerificationToken } from "../models/users-email-verification/email-verification.queries";

/**
 * Check if email verification token exists and is not expired
 * @param userId - User's ID
 * @param token - Verification token
 * @param role - User's role
 * @returns Token validation result with token ID
 */
export const checkTokenExistsOrExpiresService = async (
  userId: string,
  token: string,
) => {
  const tokenRecord = await findValidVerificationToken(userId, token);

  if (!tokenRecord) {
    throw createError.validation(ERROR_MESSAGES.SOMETHING_WENT_WRONG, {
      error: "Invalid or expired verification token",
    });
  }

  return { tokenId: tokenRecord.id, isValid: true };
};
