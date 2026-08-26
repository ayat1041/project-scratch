// Use dynamic imports for ESM-only packages like arctic
import dotenv from "dotenv";
dotenv.config();
let _arctic: typeof import("arctic") | null = null;

const getArctic = async () => {
  if (!_arctic) {
    _arctic = await import("arctic");
  }
  return _arctic;
};

export const createGoogleAuth = async () => {
  const arctic = await getArctic();
  return new arctic.Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    (IS_DEVELOPMENT ? "http://localhost:8000" : process.env.DOMAIN) +
      "/api/auth/v1/google",
  );
};

export const createLinkedInAuth = async () => {
  const arctic = await getArctic();
  return new arctic.LinkedIn(
    process.env.LINKEDIN_CLIENT_ID!,
    process.env.LINKEDIN_CLIENT_SECRET!,
    (IS_DEVELOPMENT ? "http://localhost:8000" : process.env.DOMAIN) +
      "/api/auth/v1/linkedin",
  );
};

// Treat staging as production-like for security-sensitive behavior:
// no debug tokens/links, secure cookies, and sanitized error responses.
export const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const IS_STAGING = process.env.NODE_ENV === "staging";
export const IS_DEV = process.env.NODE_ENV === "dev";

// ----------------------------------------------------------------------------
// SITE CONFIGURATION
// ----------------------------------------------------------------------------
export const SITE_SUBDOMAINS = [
  { name: "admin", url: "https://dev-algo-ad.example.com" },
  { name: "admin", url: "http://localhost:4000" },
  { name: "admin", url: "https://algo-ad.example.com" },
  { name: "main", url: "http://localhost:3000" },
  { name: "main", url: "https://dev.example.com" },
  { name: "main", url: "https://staging.example.com" },
  { name: "main", url: "https://example.com" },
];

// ----------------------------------------------------------------------------
// TOKEN NAMES
// ----------------------------------------------------------------------------
// Session Token (Single token approach - recommended)
export const SESSION_TOKEN_NAME =
  process.env.SESSION_TOKEN_NAME || "session_token";

// ----------------------------------------------------------------------------
// CSRF Configuration
// ----------------------------------------------------------------------------
export const CSRF_TOKEN_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";
// CSRF_SECRET must be a dedicated secret — never share it with JWT_SECRET.
// Sharing secrets violates defense-in-depth: a single leaked key would
// compromise both session integrity and CSRF protection simultaneously.
if (!process.env.CSRF_SECRET) {
  throw new Error(
    "Missing required environment variable: CSRF_SECRET. " +
      "Set a dedicated secret distinct from JWT_SECRET.",
  );
}
export const CSRF_SECRET = process.env.CSRF_SECRET;
export const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Legacy token names (kept for backward compatibility during migration)
export const ACCESS_TOKEN_NAME =
  process.env.ACCESS_TOKEN_NAME || "access_token";
export const REFRESH_TOKEN_NAME =
  process.env.REFRESH_TOKEN_NAME || "refresh_token";

export const VERIFICATION_TOKEN_NAME = "verification_token";
export const FORGOT_PASSWORD_TOKEN_NAME = "forgot_password_token";
export const RESET_PASSWORD_TOKEN_NAME = "reset_password_token";

// ----------------------------------------------------------------------------
// CONSTANTS FOR TOKENS AND COOKIES
// ----------------------------------------------------------------------------
// Session Token Configuration (Single token approach)
export const SESSION_TOKEN_AGE =
  process.env.SESSION_TOKEN_AGE || "30 days from now";
export const SESSION_COOKIE_MAX_AGE =
  Number(process.env.SESSION_COOKIE_MAX_AGE) || 30 * 24 * 60 * 60 * 1000; // 30 days
// Sliding window: refresh token if older than this threshold (active users stay logged in)
export const SESSION_REFRESH_THRESHOLD =
  Number(process.env.SESSION_REFRESH_THRESHOLD) || 1 * 60 * 60 * 1000; // 1 hour

export const VERIFICATION_TOKEN_AGE = "7 days from now"; // 7 days in seconds (same as ACCESS_TOKEN_AGE for consistency)
export const VERIFICATION_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const FORGOT_PASSWORD_TOKEN_AGE = "15 mins from now";
export const FORGOT_PASSWORD_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minutes in milliseconds

// Legacy token configuration (kept for backward compatibility)
export const REFRESH_TOKEN_AGE =
  process.env.REFRESH_TOKEN_AGE || "30 days from now";
export const REFRESH_TOKEN_COOKIE_MAX_AGE =
  Number(process.env.REFRESH_TOKEN_COOKIE_MAX_AGE) || 1000 * 60 * 60 * 24 * 30;
export const ACCESS_TOKEN_AGE =
  process.env.ACCESS_TOKEN_AGE || "15 mins from now";
export const ACCESS_TOKEN_COOKIE_MAX_AGE =
  Number(process.env.ACCESS_TOKEN_COOKIE_MAX_AGE) || 1000 * 60 * 15;

// ----------------------------------------------------------------------------
// DOMAIN CONFIGURATION
// ----------------------------------------------------------------------------
export const COMMON_BASE = IS_DEVELOPMENT ? "localhost" : ".example.com";
export const FRONTEND_URL = (() => {
  switch (true) {
    case IS_DEV:
      return "https://dev.example.com";
    case IS_STAGING:
      return "https://staging.example.com";
    case IS_PRODUCTION:
      return "https://example.com";
    default:
      return `http://localhost:3000`;
  }
})();
export const ADMIN_DASHBOARD_URL = (() => {
  switch (true) {
    case IS_DEVELOPMENT:
      return `http://localhost:4000`;

    default:
      return `https://algo-ad.example.com`;
  }
})();
export const DOMAIN =
  process.env.NODE_ENV === "production"
    ? process.env.DOMAIN
    : "http://localhost:3000";

// ----------------------------------------------------------------------------
// GOOGLE OAUTH CONFIGURATION
// ----------------------------------------------------------------------------
// Removed synchronous google export - use createGoogleAuth() instead

// ----------------------------------------------------------------------------
// LINKEDIN OAUTH CONFIGURATION
// ----------------------------------------------------------------------------
// Removed synchronous linkedin export - use createLinkedInAuth() instead

// ----------------------------------------------------------------------------
// SITE TYPE / ROUTE ACCESS
// ----------------------------------------------------------------------------
export const SITE_TYPE = {
  ADMIN: "admin",
  MAIN: "main",
};

export const SUBDOMAINS = SITE_SUBDOMAINS.map((site) => site.url);

export const ROUTE_ACCESS_TYPE = {
  ADMIN: "admin",
  NON_ADMIN: "non_admin",
};
