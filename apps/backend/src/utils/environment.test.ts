import assert from "node:assert/strict";
import test from "node:test";

import {
  EnvironmentValidationError,
  validateEnvironment,
} from "@/utils/environment";

const secret = (suffix: string) => `test-secret-${suffix}-${"x".repeat(40)}`;

function validEnvironment(
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "development",
    DATABASE_URL: "postgresql://user:password@localhost:5432/app",
    JWT_SECRET: secret("jwt"),
    CSRF_SECRET: secret("csrf"),
    EMAIL_HOST: "smtp.example.com",
    EMAIL_USER: "smtp-user",
    EMAIL_FROM: "auth@example.com",
    RESEND_USER: "resend-user",
    RESEND_PASSWORD: "resend-password",
    DISCORD_WEBHOOK_URL: "https://discord.example.com/webhook",
    GOOGLE_CLIENT_ID: "google-client-id",
    GOOGLE_CLIENT_SECRET: "google-client-secret",
    ...overrides,
  };
}

test("validateEnvironment accepts a complete development environment", () => {
  const env = validateEnvironment(validEnvironment());

  assert.equal(env.NODE_ENV, "development");
  assert.equal(
    env.DATABASE_URL,
    "postgresql://user:password@localhost:5432/app",
  );
});

test("validateEnvironment rejects missing required values", () => {
  const env = validEnvironment({ DATABASE_URL: undefined });

  assert.throws(
    () => validateEnvironment(env),
    (error) => {
      assert.ok(error instanceof EnvironmentValidationError);
      assert.match(error.message, /DATABASE_URL/);
      return true;
    },
  );
});

test("validateEnvironment rejects shared JWT and CSRF secrets", () => {
  const sharedSecret = secret("shared");
  const env = validEnvironment({
    JWT_SECRET: sharedSecret,
    CSRF_SECRET: sharedSecret,
  });

  assert.throws(
    () => validateEnvironment(env),
    (error) => {
      assert.ok(error instanceof EnvironmentValidationError);
      assert.match(error.message, /CSRF_SECRET must be different/);
      return true;
    },
  );
});

test("validateEnvironment requires HTTPS domain and Redis URL for staging", () => {
  const env = validEnvironment({
    NODE_ENV: "staging",
    DOMAIN: "http://staging.example.com",
    REDIS_URL: undefined,
  });

  assert.throws(
    () => validateEnvironment(env),
    (error) => {
      assert.ok(error instanceof EnvironmentValidationError);
      assert.match(error.message, /DOMAIN must be HTTPS/);
      assert.match(error.message, /REDIS_URL is required/);
      return true;
    },
  );
});
