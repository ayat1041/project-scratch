import { IS_DEVELOPMENT } from "@/constants/variables";
import { ERROR_MESSAGES } from "@/constants/messages";
import { createError } from "@/middleware/error.middleware";
import { Request, Response } from "express";

const oauthCookieOptions = {
  path: "/",
  domain: IS_DEVELOPMENT ? undefined : ".example.com",
};

export function clearOAuthCookies(res: Response, cookieNames: string[]): void {
  for (const cookieName of cookieNames) {
    res.clearCookie(cookieName, oauthCookieOptions);
  }
}

export function normalizeOAuthEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;

  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail.length > 0 ? normalizedEmail : null;
}

export function assertVerifiedOAuthEmail(
  providerName: "Google" | "LinkedIn",
  email: unknown,
  isEmailVerified: unknown,
): string {
  const normalizedEmail = normalizeOAuthEmail(email);

  if (!normalizedEmail) {
    throw createError.badRequest(
      `${providerName} did not return an email address.`,
      {
        error: "OAuth provider response is missing a usable email address",
        hint: `Please ensure your ${providerName} account has an email address and try again.`,
      },
    );
  }

  if (isEmailVerified !== true) {
    throw createError.forbidden(
      `Please use a verified ${providerName} email address.`,
      {
        error: "OAuth provider did not mark the email address as verified",
        hint: `Verify your email address with ${providerName} before signing in.`,
      },
    );
  }

  return normalizedEmail;
}

export function assertOAuthEmailMatchesToken({
  providerName,
  tokenEmail,
  providerEmail,
}: {
  providerName: "Google" | "LinkedIn";
  tokenEmail: unknown;
  providerEmail: string;
}): void {
  const normalizedTokenEmail = normalizeOAuthEmail(tokenEmail);

  if (!normalizedTokenEmail || normalizedTokenEmail !== providerEmail) {
    throw createError.badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG, {
      error: `${providerName} email does not match the verification token email`,
      hint: "Please restart the OAuth flow from the correct verification link.",
    });
  }
}

export function getOAuthCallbackParams({
  providerName,
  code,
  state,
}: {
  providerName: "Google" | "LinkedIn";
  code: string | null;
  state: string | null;
}): { code: string; state: string } {
  if (!code || !state) {
    throw createError.badRequest(`Invalid ${providerName} OAuth callback.`, {
      error: "OAuth callback is missing required code or state parameter",
      hint: "Please restart the sign-in flow.",
    });
  }

  return { code, state };
}

export function assertOAuthState({
  providerName,
  savedState,
  receivedState,
}: {
  providerName: "Google" | "LinkedIn";
  savedState: unknown;
  receivedState: string;
}): void {
  if (typeof savedState !== "string" || savedState.length === 0) {
    throw createError.validation(`Missing ${providerName} OAuth state.`, {
      error: "savedState is missing in the request",
      hint: "Please restart the sign-in flow.",
    });
  }

  if (savedState !== receivedState) {
    throw createError.validation("OAuth state mismatch", {
      error: "The state parameter does not match the saved state",
      hint: "Please restart the sign-in flow.",
    });
  }
}

export function getSafeOAuthRedirectPath(req: Request): string {
  const rawRedirect = req.query.redirectTo;

  return typeof rawRedirect === "string" &&
    rawRedirect.startsWith("/") &&
    !rawRedirect.startsWith("//")
    ? rawRedirect
    : "/";
}
