import {
  SESSION_COOKIE_MAX_AGE,
  SESSION_TOKEN_AGE,
  SESSION_TOKEN_NAME,
  SITE_SUBDOMAINS,
} from "@/constants/variables";
import { decrypt } from "@/lib/auth.utils";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { createError } from "@/middleware/error.middleware";
import { Request, Response, NextFunction } from "express";

import { encrypt } from "@/lib/auth.utils";
import { setCsrfCookie } from "@/lib/csrf.utils";
import { randomUUID } from "crypto";
import { UAParser } from "ua-parser-js";
import { appUserRefreshTokensTable } from "@/db/schema";
import { ERROR_MESSAGES } from "@/constants/messages";
import { sessionCookieOptions } from "@/lib/session-auth.utils";

/**
 * Authentication Middleware
 *
 * Supports both:
 * 1. New single session token approach (preferred)
 * 2. Legacy access + refresh token approach (backward compatible)
 *
 * Features:
 * - Sliding window session refresh (auto-rotates tokens for active users)
 * - Token reuse detection (security feature)
 * - Optional restriction (allow unauthenticated access for public routes)
 */

export function getSiteContext(req: Request): "main" | "admin" {
  // 1. Check for explicit site context header (for API testing tools like Postman)
  const explicitContext = req.headers["x-site-context"] as string;
  if (explicitContext === "main" || explicitContext === "admin") {
    return explicitContext;
  }

  // 2. Check query parameter (alternative for API testing)
  const queryContext = req.query.siteContext as string;
  if (queryContext === "main" || queryContext === "admin") {
    return queryContext;
  }

  // 3. Try to determine from origin/referer (browser requests)
  const origin = req.headers.origin || req.headers.referer || "";

  if (origin) {
    // Find matching subdomain from SITE_SUBDOMAINS
    const matchingSite = SITE_SUBDOMAINS.find((site) => {
      const siteURL = new URL(site.url);

      // For localhost development, match the full origin (including port)
      if (siteURL.hostname === "localhost") {
        return origin === site.url;
      }

      // For production URLs, match by hostname
      return origin.includes(siteURL.hostname);
    });

    if (matchingSite) {
      return matchingSite.name as "main" | "admin";
    }
  }

  // 4. Check Host header as fallback (for cases where origin is not available)
  const host = req.headers.host;
  if (host) {
    const matchingSiteByHost = SITE_SUBDOMAINS.find((site) => {
      const siteURL = new URL(site.url);
      return host.includes(siteURL.host);
    });

    if (matchingSiteByHost) {
      return matchingSiteByHost.name as "main" | "admin";
    }
  }

  // 5. Default fallback for API testing and edge cases
  // Default to "main" for backward compatibility and API testing
  console.warn(
    `Unable to determine site context from origin: "${origin}", host: "${host}". Defaulting to "main".`,
  );
  return "main";
}
export const isAuthenticated = (publicAccess: boolean = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.locals.allowsPublicAccess = publicAccess;

    const sessionToken =
      req.cookies[SESSION_TOKEN_NAME] ||
      (req.headers[SESSION_TOKEN_NAME] as string);

    if (!sessionToken) {
      if (!publicAccess) {
        throw createError.unauthorized(ERROR_MESSAGES.AUTHENTICATION_REQUIRED, {
          error: "No authentication token provided",
          hint: "Please log in to access this resource.",
        });
      }
      res.locals.hasPublicAccess = true; // Mark as public access for downstream middleware/controllers
      return next(); // No token, not restricted → just next()
    }

    let result: ValidationResult;
    try {
      result = await validateSessionToken(req, res, sessionToken);
    } catch {
      if (!publicAccess) {
        throw createError.unauthorized(ERROR_MESSAGES.AUTHENTICATION_REQUIRED, {
          error: "No authentication token provided",
          hint: "Please log in to access this resource.",
        });
      }

      res.locals.hasPublicAccess = true;
      return next();
    }

    if (!result.success) {
      if (!publicAccess) {
        throw createError.unauthorized(ERROR_MESSAGES.AUTHENTICATION_REQUIRED, {
          error: "No authentication token provided",
          hint: "Please log in to access this resource.",
        });
      }
      res.locals.hasPublicAccess = true; // Mark as public access for downstream middleware/controllers
      return next(); // Invalid session, not restricted → just next()
    }

    // Valid session → always set userId and next()
    res.locals.userId = result.userId;
    res.locals.userEmail = result.email;
    res.locals.user = { id: result.userId };
    return next();
  };
};

// ----------------------------------------------------------------------------
// Session Token Validation Helper
// ----------------------------------------------------------------------------
interface ValidationResult {
  success: boolean;
  userId?: string;
  message?: string;
  error?: string;
  email?: string;
}

export async function validateSessionToken(
  req: Request,
  res: Response,
  sessionToken: string,
): Promise<ValidationResult> {
  // Decrypt and validate token — decrypt() returns error object instead of throwing
  const payload = await decrypt(sessionToken);

  // Handle JWT errors
  if (payload.code === "ERR_JWT_EXPIRED") {
    res.clearCookie(SESSION_TOKEN_NAME, sessionCookieOptions());
    throw createError.unauthorized(ERROR_MESSAGES.AUTHENTICATION_REQUIRED, {
      error: "Your session has expired",
      hint: "Please log in again.",
    });
  }

  if (payload.code || !payload.jti) {
    res.clearCookie(SESSION_TOKEN_NAME, sessionCookieOptions());
    throw createError.unauthorized(ERROR_MESSAGES.AUTHENTICATION_REQUIRED, {
      error: "Your session has expired",
      hint: "Please log in again.",
    });
  }

  // Validate session exists in database and not revoked
  const [session] = await db
    .select()
    .from(appUserRefreshTokensTable)
    .where(eq(appUserRefreshTokensTable.jti, payload.jti))
    .limit(1);

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    res.clearCookie(SESSION_TOKEN_NAME, sessionCookieOptions());
    return {
      success: false,
      message: "Session invalid or expired",
      error: "Session has been revoked or expired",
    };
  }

  // Check for token reuse (replay attack detection)
  if (session.rotatedTo) {
    // This token was already rotated. Two possibilities:
    //
    // 1. BENIGN RACE — a concurrent request (e.g. Next.js middleware firing on
    //    back-to-back navigations) arrived after rotation was written to the DB
    //    but before the browser received the new cookie from the first response.
    //    The successor session will be alive and itself not yet rotated.
    //
    // 2. GENUINE REPLAY ATTACK — a stolen old token is being replayed. By the
    //    time it arrives the legitimate user will have consumed the successor
    //    session (rotating it further), so the successor will itself be rotated
    //    or revoked/missing.
    //
    // Distinguish the two by inspecting the successor session.
    const [successorSession] = await db
      .select()
      .from(appUserRefreshTokensTable)
      .where(eq(appUserRefreshTokensTable.jti, session.rotatedTo))
      .limit(1);

    const successorIsAlive =
      successorSession &&
      !successorSession.revokedAt &&
      successorSession.expiresAt > new Date() &&
      !successorSession.rotatedTo; // successor has not itself been consumed

    if (successorIsAlive) {
      // Benign race — re-issue the successor cookie so the browser is
      // guaranteed to get it, then continue as normal.

      const newSessionToken = await encrypt(
        {
          id: successorSession.userId,
          email: payload.email,
          jti: successorSession.jti,
          familyId: successorSession.familyId,
        },
        SESSION_TOKEN_AGE,
      );
      res.cookie(SESSION_TOKEN_NAME, newSessionToken, sessionCookieOptions());
      setCsrfCookie(res, successorSession.userId);

      return {
        success: true,
        userId: successorSession.userId,
        email: payload.email,
      };
    }

    // Genuine replay attack or compromised chain — revoke entire family.

    await db
      .update(appUserRefreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(appUserRefreshTokensTable.familyId, session.familyId));

    res.clearCookie(SESSION_TOKEN_NAME, sessionCookieOptions());
    return {
      success: false,
      message: "Security alert: Token reuse detected",
      error:
        "This session token has already been used. All sessions have been revoked.",
    };
  }

  // SLIDING WINDOW REFRESH
  // If token is older than threshold, issue a new one
  const SESSION_REFRESH_THRESHOLD = 1 * 15 * 60 * 1000; // 15 minutes
  const tokenAge = Date.now() - (payload.iat || 0) * 1000;

  if (tokenAge > SESSION_REFRESH_THRESHOLD) {
    await rotateSessionToken(req, res, session, payload);
  }

  return {
    success: true,
    userId: session.userId,
    email: payload.email,
  };
}

// ----------------------------------------------------------------------------
// Session Rotation Helper
// ----------------------------------------------------------------------------
async function rotateSessionToken(
  req: Request,
  res: Response,
  currentSession: typeof appUserRefreshTokensTable.$inferSelect,
  currentPayload: { jti: string; familyId: string; email?: string },
): Promise<void> {
  const newJti = randomUUID();

  // Get device info
  const userAgent = req.headers["user-agent"] || "unknown";
  const parser = new UAParser(userAgent);
  const deviceInfo = {
    os: parser.getOS(),
    browser: parser.getBrowser(),
    device: parser.getDevice(),
    engine: parser.getEngine(),
  };

  // Create new session record
  await db.insert(appUserRefreshTokensTable).values({
    jti: newJti,
    familyId: currentSession.familyId,
    userId: currentSession.userId,
    expiresAt: new Date(Date.now() + SESSION_COOKIE_MAX_AGE),
    ip: req.ip as string,
    deviceInfo: JSON.stringify(deviceInfo),
  });

  // Mark old session as rotated
  await db
    .update(appUserRefreshTokensTable)
    .set({ rotatedTo: newJti })
    .where(eq(appUserRefreshTokensTable.jti, currentPayload.jti));

  // Generate new session token
  const newSessionToken = await encrypt(
    {
      id: currentSession.userId,
      email: currentPayload.email,
      jti: newJti,
      familyId: currentSession.familyId,
    },
    SESSION_TOKEN_AGE,
  );

  // Set new cookies
  res.cookie(SESSION_TOKEN_NAME, newSessionToken, sessionCookieOptions());
  setCsrfCookie(res, currentSession.userId);
}
