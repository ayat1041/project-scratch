import { Request, Response, NextFunction } from "express";
import {
  validateCsrfOrigin,
  validateCsrfRequest,
  setCsrfCookie,
} from "@/lib/csrf.utils";
import { createError } from "@/middleware/error.middleware";
import { CSRF_TOKEN_NAME, IS_PRODUCTION } from "@/constants/variables";

/**
 * CSRF Protection Middleware
 *
 * Uses Double-Submit Cookie Pattern:
 * 1. Server sets a signed CSRF token in a non-HttpOnly cookie
 * 2. Client reads the cookie and sends it back in a header
 * 3. Server validates both match and the signature is valid
 *
 * This protects against CSRF because:
 * - Attackers can't read the cookie value from another domain (Same-Origin Policy)
 * - Attackers can't set custom headers in cross-origin requests
 *
 * @param options.refreshOnSuccess - Generate new CSRF token after successful validation
 * @param options.requireTrustedOrigin - Require Origin/Referer to match trusted site origins
 * @param options.skipMethods - HTTP methods to skip CSRF validation (default: GET, HEAD, OPTIONS)
 */
export const csrfProtection = (
  options: {
    refreshOnSuccess?: boolean;
    requireTrustedOrigin?: boolean;
    skipMethods?: string[];
  } = {},
) => {
  const {
    refreshOnSuccess = true,
    requireTrustedOrigin = IS_PRODUCTION,
    skipMethods = ["GET", "HEAD", "OPTIONS"],
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip CSRF validation for safe methods
      if (skipMethods.includes(req.method.toUpperCase())) {
        // For GET requests, ensure CSRF cookie exists (for initial page loads)
        if (!req.cookies[CSRF_TOKEN_NAME]) {
          const userId = res.locals.userId;
          setCsrfCookie(res, userId);
        }
        return next();
      }

      // Get user ID from authenticated session (if available)
      const userId = res.locals.userId;

      const originValidation = validateCsrfOrigin(req, {
        requireTrustedOrigin,
      });

      if (!originValidation.valid) {
        throw createError.forbidden("CSRF validation failed", {
          error: originValidation.error,
          hint: "Ensure the request comes from a trusted Starter origin.",
        });
      }

      // Validate CSRF token
      const validation = validateCsrfRequest(req, userId);

      if (!validation.valid) {
        throw createError.forbidden("CSRF validation failed", {
          error: validation.error,
          hint: "Ensure you're sending the CSRF token in the X-CSRF-Token header.",
        });
      }

      // Optionally refresh CSRF token on successful validation
      if (refreshOnSuccess) {
        setCsrfCookie(res, userId);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * Middleware to set/refresh CSRF token cookie
 * Use this on routes where you want to ensure a CSRF token exists
 * (e.g., login page, after authentication)
 */
export const ensureCsrfToken = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res.locals.userId;
      setCsrfCookie(res, userId);
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * Optional: Strict CSRF middleware that always validates
 * regardless of HTTP method (for extra sensitive routes)
 */
export const strictCsrfProtection = () => {
  return csrfProtection({ skipMethods: [], refreshOnSuccess: true });
};
