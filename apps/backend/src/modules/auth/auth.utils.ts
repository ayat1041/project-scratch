import { Request, Response } from "express";
import { createError } from "@/middleware/error.middleware";
import { getSiteContext } from "@/middleware/authentication.middleware";
import { PERMISSIONS } from "@repo/constants";
import { IS_DEV, IS_DEVELOPMENT, SITE_TYPE } from "@/constants/variables";
import axios from "axios";

/**
 * Extracts and validates userId from response locals
 * Throws standardized error if userId is missing
 *
 * Use this in controllers after isAuthenticated middleware
 */
export const getUserIdFromAuth = (res: Response): string => {
  const userId = res?.locals?.userId;

  if (!userId) {
    throw createError.unauthorized("Unauthorized", {
      error: "User does not exist",
      hint: "Please authenticate first",
    });
  }

  return userId;
};

/**
 * Type-safe version that returns userId or null
 * Use when you need to handle missing userId gracefully
 */
export const tryGetUserIdFromAuth = (res: Response): string | null => {
  return res?.locals?.userId || null;
};

/**
 * Validates that user is accessing the correct portal based on their admin status
 *
 * @param req - Express request object
 * @param userPermissions - Array of user permissions
 * @throws Error if user is trying to access wrong portal
 */
export const validateSiteContextForUser = (
  req: Request,
  userPermissions: string[],
  context: "signin" | "others" = "others",
): string => {
  const isUserAdmin = userPermissions.includes(
    PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
  );
  const siteContext = getSiteContext(req); // "main" or "admin"

  if (siteContext === SITE_TYPE.MAIN && isUserAdmin) {
    throw createError.forbidden(
      IS_DEVELOPMENT || IS_DEV
        ? "Admin users must sign in through the admin panel"
        : context === "signin"
          ? "Email or password is incorrect."
          : "Email is incorrect.",
    );
  }

  if (siteContext === SITE_TYPE.ADMIN && !isUserAdmin) {
    throw createError.forbidden(
      IS_DEVELOPMENT || IS_DEV
        ? "Only admin users can sign in through the admin panel"
        : context === "signin"
          ? "Email or password is incorrect."
          : "Email is incorrect.",
    );
  }
  return siteContext;
};

// Email reputation check function
export async function checkDisposableEmail(email: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://emailreputation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`,
      {
        timeout: 5000, // 5 second timeout
      },
    );

    // Check if email is disposable based on actual API response structure
    const emailQuality = response.data?.email_quality;

    if (!emailQuality) {
      // If API response doesn't have expected structure, fail open
      return false;
    }

    // Primary check: is_disposable field indicates temporary/disposable emails
    return emailQuality.is_disposable === true;
  } catch (error) {
    // Fail open - if API is down, allow signup to continue
    console.warn("Disposable email check failed:", error);
    return false;
  }
}
