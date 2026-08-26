import assert from "node:assert/strict";
import test from "node:test";

import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";

process.env.CSRF_SECRET ??= "test-csrf-secret-for-origin-validation";
process.env.NODE_ENV ??= "test";

const testUserId = "00000000-0000-4000-8000-000000000001";

async function createCsrfTestApp() {
  const { csrfProtection } = await import("@/middleware/csrf.middleware");

  const app = express();
  app.use(cookieParser());

  app.post(
    "/mutate",
    (_req, res, next) => {
      res.locals.userId = testUserId;
      next();
    },
    csrfProtection({ requireTrustedOrigin: true }),
    (_req, res) => {
      res.status(200).json({ success: true });
    },
  );

  app.use(
    (
      error: { type?: string; message?: string; details?: unknown },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      void _next;

      res.status(error.type === "forbidden" ? 403 : 500).json({
        success: false,
        message: error.message,
        details: error.details,
      });
    },
  );

  return app;
}

async function createCsrfRequestParts() {
  const { CSRF_HEADER_NAME, CSRF_TOKEN_NAME } =
    await import("@/constants/variables");
  const { generateCsrfToken } = await import("@/lib/csrf.utils");
  const token = generateCsrfToken(testUserId);

  return {
    headerName: CSRF_HEADER_NAME,
    cookie: `${CSRF_TOKEN_NAME}=${token}`,
    token,
  };
}

function getCsrfCookieValue(response: request.Response): string {
  const setCookieHeader = response.headers["set-cookie"];
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : typeof setCookieHeader === "string"
      ? [setCookieHeader]
      : [];
  const csrfCookie = cookies.find((cookie) => cookie.startsWith("csrf_token="));

  assert.ok(csrfCookie);
  return csrfCookie.split(";")[0]!.replace("csrf_token=", "");
}

test("csrfProtection rejects unsafe requests when trusted Origin/Referer is required but missing", async () => {
  const app = await createCsrfTestApp();
  const csrf = await createCsrfRequestParts();

  const response = await request(app)
    .post("/mutate")
    .set("Cookie", csrf.cookie)
    .set(csrf.headerName, csrf.token);

  assert.equal(response.status, 403, response.text);
  assert.match(response.text, /origin missing/i);
});

test("csrfProtection rejects unsafe requests from untrusted origins", async () => {
  const app = await createCsrfTestApp();
  const csrf = await createCsrfRequestParts();

  const response = await request(app)
    .post("/mutate")
    .set("Origin", "https://evil.example.com")
    .set("Cookie", csrf.cookie)
    .set(csrf.headerName, csrf.token);

  assert.equal(response.status, 403, response.text);
  assert.match(response.text, /origin is not trusted/i);
});

test("csrfProtection accepts trusted Referer fallback and rotates CSRF token", async () => {
  const app = await createCsrfTestApp();
  const csrf = await createCsrfRequestParts();

  const response = await request(app)
    .post("/mutate")
    .set("Referer", "http://localhost:3000/settings/security")
    .set("Cookie", csrf.cookie)
    .set(csrf.headerName, csrf.token);

  assert.equal(response.status, 200, response.text);

  const rotatedToken = getCsrfCookieValue(response);
  assert.notEqual(rotatedToken, csrf.token);
});
