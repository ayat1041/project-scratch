import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Request, Response } from "express";
import {
  COMMON_BASE,
  CSRF_HEADER_NAME,
  CSRF_SECRET,
  CSRF_TOKEN_EXPIRY,
  CSRF_TOKEN_NAME,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  SITE_SUBDOMAINS,
} from "@/constants/variables";
import type { CookieOptions } from "express";

// ----------------------------------------------------------------------------
// CSRF Token Structure: timestamp.randomBytes.signature
// ----------------------------------------------------------------------------

/**
 * Generate a signed CSRF token
 * Format: timestamp.randomBytes.hmacSignature
 */
export function generateCsrfToken(userId?: string): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(16).toString("hex");
  const payload = `${timestamp}.${random}${userId ? `.${userId}` : ""}`;

  const signature = createHmac("sha256", CSRF_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 32); // Use first 32 chars for shorter token

  return `${payload}.${signature}`;
}

/**
 * Verify a CSRF token
 * Returns { valid: boolean, expired: boolean, userId?: string }
 */
export function verifyCsrfToken(
  token: string,
  expectedUserId?: string,
): { valid: boolean; expired: boolean; userMismatch: boolean } {
  try {
    const parts = token.split(".");

    // Token should have 3 or 4 parts (with or without userId)
    if (parts.length < 3 || parts.length > 4) {
      return { valid: false, expired: false, userMismatch: false };
    }

    const timestamp = parts[0];
    const random = parts[1];
    const hasUserId = parts.length === 4;
    const userId = hasUserId ? parts[2] : undefined;
    const signature = hasUserId ? parts[3] : parts[2];

    // Reconstruct payload and verify signature
    const payload = hasUserId
      ? `${timestamp}.${random}.${userId}`
      : `${timestamp}.${random}`;

    const expectedSignature = createHmac("sha256", CSRF_SECRET)
      .update(payload)
      .digest("hex")
      .slice(0, 32);

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, expired: false, userMismatch: false };
    }

    const signatureValid = timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!signatureValid) {
      return { valid: false, expired: false, userMismatch: false };
    }

    // Check expiry
    const tokenTime = parseInt(timestamp, 36);
    const isExpired = Date.now() - tokenTime > CSRF_TOKEN_EXPIRY;

    if (isExpired) {
      return { valid: false, expired: true, userMismatch: false };
    }

    // Check user ID match if provided
    if (expectedUserId !== undefined && userId !== undefined) {
      const userMismatch = userId !== expectedUserId;
      return { valid: !userMismatch, expired: false, userMismatch };
    }

    return { valid: true, expired: false, userMismatch: false };
  } catch {
    return { valid: false, expired: false, userMismatch: false };
  }
}

/**
 * CSRF Cookie options - NOT HttpOnly so frontend JS can read it
 */
export function csrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false, // Must be readable by JavaScript to send as header
    sameSite: IS_DEVELOPMENT ? "lax" : "strict",
    secure: !IS_DEVELOPMENT,
    maxAge: CSRF_TOKEN_EXPIRY,
    domain: IS_DEVELOPMENT ? undefined : COMMON_BASE,
    path: "/",
  };
}

/**
 * Set CSRF token cookie on response
 */
export function setCsrfCookie(res: Response, userId?: string): string {
  const token = generateCsrfToken(userId);
  res.cookie(CSRF_TOKEN_NAME, token, csrfCookieOptions());
  return token;
}

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getTrustedCsrfOrigins(): Set<string> {
  return new Set(
    SITE_SUBDOMAINS.map((site) => normalizeOrigin(site.url)).filter(
      (origin): origin is string => {
        if (!origin) return false;

        // Production-like environments must only trust HTTPS browser origins.
        return IS_PRODUCTION ? origin.startsWith("https://") : true;
      },
    ),
  );
}

function getRequestOrigin(req: Request): string | null {
  const originHeader = req.get("origin");
  if (originHeader) return normalizeOrigin(originHeader);

  const refererHeader = req.get("referer");
  if (refererHeader) return normalizeOrigin(refererHeader);

  return null;
}

/**
 * Validate Origin/Referer before accepting a CSRF token.
 *
 * Missing origins are allowed in local/test tooling unless explicitly required,
 * but any present untrusted origin is rejected in every environment.
 */
export function validateCsrfOrigin(
  req: Request,
  options: { requireTrustedOrigin?: boolean } = {},
): { valid: boolean; error?: string } {
  const { requireTrustedOrigin = IS_PRODUCTION } = options;
  const requestOrigin = getRequestOrigin(req);

  if (!requestOrigin) {
    return requireTrustedOrigin
      ? { valid: false, error: "CSRF request origin missing" }
      : { valid: true };
  }

  if (!getTrustedCsrfOrigins().has(requestOrigin)) {
    return { valid: false, error: "CSRF request origin is not trusted" };
  }

  return { valid: true };
}

/**
 * Get CSRF token from request (header takes precedence over cookie)
 */
export function getCsrfTokenFromRequest(req: Request): string | undefined {
  // Check header first (preferred method)
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  if (headerToken) return headerToken;

  // Fall back to cookie (for initial page loads)
  return req.cookies[CSRF_TOKEN_NAME];
}

/**
 * Validate CSRF token from request against cookie
 * Uses double-submit cookie pattern
 */
export function validateCsrfRequest(
  req: Request,
  userId?: string,
): { valid: boolean; error?: string } {
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  const cookieToken = req.cookies[CSRF_TOKEN_NAME] as string | undefined;

  // Must have both header and cookie for double-submit pattern
  if (!headerToken) {
    return { valid: false, error: "CSRF token header missing" };
  }

  if (!cookieToken) {
    return { valid: false, error: "CSRF token cookie missing" };
  }

  // Tokens must match (double-submit verification)
  if (headerToken !== cookieToken) {
    return { valid: false, error: "CSRF token mismatch" };
  }

  // Verify the token signature and expiry
  const verification = verifyCsrfToken(headerToken, userId);

  if (verification.expired) {
    return { valid: false, error: "CSRF token expired" };
  }

  if (verification.userMismatch) {
    return { valid: false, error: "CSRF token user mismatch" };
  }

  if (!verification.valid) {
    return { valid: false, error: "Invalid CSRF token" };
  }

  return { valid: true };
}
