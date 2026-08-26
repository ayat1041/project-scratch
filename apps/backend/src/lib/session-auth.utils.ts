import { Request, Response, NextFunction } from "express";
import { db } from "@/db/db";
import { appUserRefreshTokensTable } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/auth.utils";
import { createError } from "@/middleware/error.middleware";
import { randomUUID } from "crypto";
import { UAParser } from "ua-parser-js";
import {
  SESSION_TOKEN_NAME,
  SESSION_TOKEN_AGE,
  SESSION_COOKIE_MAX_AGE,
  SESSION_REFRESH_THRESHOLD,
  IS_DEVELOPMENT,
  COMMON_BASE,
  CSRF_TOKEN_NAME,
} from "@/constants/variables";
import type { CookieOptions } from "express";
import { setCsrfCookie, csrfCookieOptions } from "@/lib/csrf.utils";
import { ERROR_MESSAGES } from "@/constants/messages";

// Re-export for convenience
export { SESSION_TOKEN_NAME, SESSION_TOKEN_AGE, SESSION_COOKIE_MAX_AGE };

// ----------------------------------------------------------------------------
// Cookie Options
// ----------------------------------------------------------------------------
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: IS_DEVELOPMENT ? "lax" : "none",
    secure: !IS_DEVELOPMENT,
    maxAge: SESSION_COOKIE_MAX_AGE,
    domain: IS_DEVELOPMENT ? undefined : COMMON_BASE,
    path: "/",
  };
}

// ----------------------------------------------------------------------------
// Session Token Payload
// ----------------------------------------------------------------------------
interface SessionPayload {
  id: string; // User ID (UUID)
  email: string; // User email (added for convenience)
  jti: string; // Unique token ID
  familyId: string; // Family for rotation tracking
  iat?: number; // Issued at (set by JWT)
  exp?: number; // Expiry (set by JWT)
}

// ----------------------------------------------------------------------------
// Create Session (use on login)
// ----------------------------------------------------------------------------
export async function createSession(
  res: Response,
  userId: string,
  email: string,
  req: Request,
): Promise<string> {
  const jti = randomUUID();
  const familyId = randomUUID();

  // Get device info for audit trail
  const userAgent = req.headers["user-agent"] || "unknown";
  const parser = new UAParser(userAgent);
  const deviceInfo = {
    os: parser.getOS(),
    browser: parser.getBrowser(),
    device: parser.getDevice(),
    engine: parser.getEngine(),
  };

  // Store session in database
  await db.insert(appUserRefreshTokensTable).values({
    jti,
    familyId,
    userId,
    expiresAt: new Date(Date.now() + SESSION_COOKIE_MAX_AGE),
    ip: req.ip as string,
    deviceInfo: JSON.stringify(deviceInfo),
  });

  // Generate session token
  const sessionToken = await encrypt(
    { id: userId, email, jti, familyId },
    SESSION_TOKEN_AGE,
  );

  // Set session cookie
  res.cookie(SESSION_TOKEN_NAME, sessionToken, sessionCookieOptions());

  // Set CSRF cookie
  setCsrfCookie(res, userId);

  return sessionToken;
}

// ----------------------------------------------------------------------------
// Validate & Refresh Session Middleware
// ----------------------------------------------------------------------------
export const validateSession = (options: { restrict?: boolean } = {}) => {
  const { restrict = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionToken =
        req.cookies[SESSION_TOKEN_NAME] ||
        (req.headers[SESSION_TOKEN_NAME] as string);

      // No token present
      if (!sessionToken) {
        if (!restrict) return next();

        throw createError.unauthorized("Authentication required", {
          error: "Session token missing",
          hint: "Please log in to access this resource.",
        });
      }

      // Decrypt and validate token
      const payload = await decrypt(sessionToken);

      // Handle JWT errors
      if (payload.code === "ERR_JWT_EXPIRED") {
        res.clearCookie(SESSION_TOKEN_NAME, sessionCookieOptions());
        if (!restrict) return next();

        throw createError.unauthorized(ERROR_MESSAGES.AUTHENTICATION_REQUIRED, {
          error: "Your session has expired",
          hint: "Please log in again.",
        });
      }

      if (payload.code || !payload.jti) {
        res.clearCookie(SESSION_TOKEN_NAME, sessionCookieOptions());
        if (!restrict) return next();

        throw createError.unauthorized(ERROR_MESSAGES.AUTHENTICATION_REQUIRED, {
          error: "Session token is invalid",
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
        if (!restrict) return next();

        throw createError.unauthorized("Session invalid or expired", {
          error: "Session has been revoked or expired",
          hint: "Please log in again.",
        });
      }

      // Check for token reuse (replay attack detection)
      if (session.rotatedTo) {
        // Token was already rotated - this is a reuse attempt!
        // Revoke the entire family for security
        await db
          .update(appUserRefreshTokensTable)
          .set({ revokedAt: new Date() })
          .where(eq(appUserRefreshTokensTable.familyId, session.familyId));

        res.clearCookie(SESSION_TOKEN_NAME, sessionCookieOptions());

        throw createError.unauthorized("Security alert: Token reuse detected", {
          error: "This session token has already been used",
          hint: "For your security, all sessions have been revoked. Please log in again.",
        });
      }

      // Set user info on response locals
      res.locals.userId = session.userId;
      res.locals.userEmail = payload.email; // Set email in res.locals for convenience

      // SLIDING WINDOW REFRESH
      // If token is older than threshold, issue a new one
      const tokenAge = Date.now() - (payload.iat || 0) * 1000;

      if (tokenAge > SESSION_REFRESH_THRESHOLD) {
        await rotateSession(req, res, session, payload);
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};

// ----------------------------------------------------------------------------
// Rotate Session Token (internal helper)
// ----------------------------------------------------------------------------
async function rotateSession(
  req: Request,
  res: Response,
  currentSession: typeof appUserRefreshTokensTable.$inferSelect,
  currentPayload: SessionPayload,
) {
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
    familyId: currentSession.familyId, // Keep same family
    userId: currentSession.userId,
    expiresAt: new Date(Date.now() + SESSION_COOKIE_MAX_AGE),
    ip: req.ip as string,
    deviceInfo: JSON.stringify(deviceInfo),
  });

  // Mark old session as rotated (not revoked - for reuse detection)
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

// ----------------------------------------------------------------------------
// Destroy Session (use on logout)
// ----------------------------------------------------------------------------
export function clearSessionCookies(res: Response): void {
  res.clearCookie(SESSION_TOKEN_NAME, sessionCookieOptions());
  res.clearCookie(CSRF_TOKEN_NAME, csrfCookieOptions());
}

export async function destroySession(
  req: Request,
  res: Response,
  options: { allDevices?: boolean } = {},
) {
  const sessionToken = req.cookies[SESSION_TOKEN_NAME];

  if (sessionToken) {
    try {
      const payload = await decrypt(sessionToken);

      if (payload.jti) {
        if (options.allDevices && payload.familyId) {
          // Revoke all sessions for this user
          const [session] = await db
            .select()
            .from(appUserRefreshTokensTable)
            .where(eq(appUserRefreshTokensTable.jti, payload.jti))
            .limit(1);

          if (session) {
            await db
              .update(appUserRefreshTokensTable)
              .set({ revokedAt: new Date() })
              .where(eq(appUserRefreshTokensTable.userId, session.userId));
          }
        } else {
          // Revoke just this session family
          await db
            .update(appUserRefreshTokensTable)
            .set({ revokedAt: new Date() })
            .where(eq(appUserRefreshTokensTable.familyId, payload.familyId));
        }
      }
    } catch {
      // Token invalid, just clear cookie
    }
  }

  clearSessionCookies(res);
}

// ----------------------------------------------------------------------------
// Destroy Session for all devices (use on password reset or security events)
// ----------------------------------------------------------------------------
export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await db
    .update(appUserRefreshTokensTable)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(appUserRefreshTokensTable.userId, userId),
        isNull(appUserRefreshTokensTable.revokedAt),
      ),
    );
}

// ----------------------------------------------------------------------------
// Get Active Sessions (for user dashboard)
// ----------------------------------------------------------------------------
export async function getActiveSessions(userId: string) {
  const sessions = await db
    .select({
      jti: appUserRefreshTokensTable.jti,
      createdAt: appUserRefreshTokensTable.createdAt,
      expiresAt: appUserRefreshTokensTable.expiresAt,
      revokedAt: appUserRefreshTokensTable.revokedAt,
      ip: appUserRefreshTokensTable.ip,
      deviceInfo: appUserRefreshTokensTable.deviceInfo,
    })
    .from(appUserRefreshTokensTable)
    .where(eq(appUserRefreshTokensTable.userId, userId));

  return sessions
    .filter((s) => !s.revokedAt && s.expiresAt > new Date())
    .map(({ revokedAt: _revokedAt, ...s }) => ({
      ...s,
      deviceInfo: s.deviceInfo ? JSON.parse(s.deviceInfo as string) : null,
    }));
}
