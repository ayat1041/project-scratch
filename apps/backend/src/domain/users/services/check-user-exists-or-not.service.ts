import { createError } from "@/middleware/error.middleware";
import {
  getUserByEmailWithRolesAndPermissions,
  UserVerificationInfoResponse,
} from "../models/users/users.queries";

/**
 * Get user info for email verification process
 * @param email - User's email address
 * @returns User info with verification status and role
 */
export const checkUserExistsOrNotService = async (
  email: string,
): Promise<UserVerificationInfoResponse> => {
  const userInfo = await getUserByEmailWithRolesAndPermissions(email);

  if (!userInfo) {
    throw createError.notFound("Email is not found in our system.", {
      error: "No user found with the provided email address",
      hint: "Please register first or check the email address.",
    });
  }

  return userInfo;
};

export const checkUserIsVerifiedOrNotService = async (
  email: string,
  whatToCheck: "verified" | "notVerified" = "notVerified",
  context: "signin" | "emailVerification" = "emailVerification",
): Promise<UserVerificationInfoResponse> => {
  const userInfo = await getUserByEmailWithRolesAndPermissions(email);

  if (!userInfo) {
    if (context === "signin") {
      throw createError.badRequest("Email or password is incorrect.");
    } else {
      throw createError.notFound("Email is not found in our system.", {
        error: "No user found with the provided email address",
        hint: "Please register first or check the email address.",
      });
    }
  }

  if (whatToCheck === "notVerified" && !userInfo.isVerified) {
    if (context === "signin") {
      throw createError.badRequest("Email or password is incorrect.");
    }

    throw createError.conflict("Email is not verified.", {
      error: "The user associated with this email is not verified",
      hint: "Please verify your email before proceeding.",
    });
  }

  if (whatToCheck === "verified" && userInfo.isVerified) {
    throw createError.conflict("Email is already verified. Please login.", {
      error: "The email address has already been verified",
      hint: "Please proceed to login instead of requesting verification again.",
    });
  }

  return userInfo;
};
