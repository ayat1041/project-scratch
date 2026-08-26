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
    REDIS_URL: "redis://localhost:6379",
    RABBITMQ_URL: "amqp://localhost:5672",
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

test("validateEnvironment requires HTTPS domain for staging", () => {
  // REDIS_URL/RABBITMQ_URL are required unconditionally at the base schema
  // level (see redis-client.ts / rabbitmq-connection.ts, neither has a
  // fallback), so leaving one unset fails base validation before Zod ever
  // runs superRefine — there is no reachable state where both a base-level
  // issue and a superRefine-level issue appear together. This test isolates
  // the superRefine-only "DOMAIN must be HTTPS in staging/production" check.
  const env = validEnvironment({
    NODE_ENV: "staging",
    DOMAIN: "http://staging.example.com",
  });

  assert.throws(
    () => validateEnvironment(env),
    (error) => {
      assert.ok(error instanceof EnvironmentValidationError);
      assert.match(error.message, /DOMAIN must be HTTPS/);
      return true;
    },
  );
});
