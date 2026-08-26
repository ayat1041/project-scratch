import { z } from "zod";

const RUNTIME_ENVIRONMENTS = [
  "development",
  "dev",
  "test",
  "staging",
  "production",
] as const;

const nonEmptyString = z.string().trim().min(1);
const secretString = nonEmptyString.min(32);
const optionalNumberString = z
  .string()
  .trim()
  .regex(/^\d+$/, "Expected a numeric string")
  .optional();

const urlWithProtocol = (protocols: string[], label: string) =>
  nonEmptyString.refine(
    (value) => {
      try {
        const url = new URL(value);
        return protocols.includes(url.protocol);
      } catch {
        return false;
      }
    },
    { message: `Expected a valid ${label} URL` },
  );

const httpUrl = urlWithProtocol(["http:", "https:"], "HTTP(S)");
const httpsUrl = urlWithProtocol(["https:"], "HTTPS");
const postgresUrl = urlWithProtocol(["postgres:", "postgresql:"], "PostgreSQL");
const redisUrl = urlWithProtocol(["redis:", "rediss:"], "Redis");
const rabbitmqUrl = urlWithProtocol(["amqp:", "amqps:"], "RabbitMQ");

const baseEnvironmentSchema = z
  .object({
    NODE_ENV: z.enum(RUNTIME_ENVIRONMENTS).default("development"),
    PORT: optionalNumberString,

    DATABASE_URL: postgresUrl,
    JWT_SECRET: secretString,
    CSRF_SECRET: secretString,

    EMAIL_HOST: nonEmptyString,
    EMAIL_USER: nonEmptyString,
    EMAIL_FROM: nonEmptyString,
    RESEND_USER: nonEmptyString,
    RESEND_PASSWORD: nonEmptyString,

    DISCORD_WEBHOOK_URL: nonEmptyString,
    GOOGLE_CLIENT_ID: nonEmptyString,
    GOOGLE_CLIENT_SECRET: nonEmptyString,

    DOMAIN: httpUrl.optional(),
    REDIS_URL: redisUrl,
    RABBITMQ_URL: rabbitmqUrl,
    // ABSTRACT_API_KEY: nonEmptyString.optional(),
    LINKEDIN_CLIENT_ID: nonEmptyString.optional(),
    LINKEDIN_CLIENT_SECRET: nonEmptyString.optional(),

    ACCESS_TOKEN_NAME: nonEmptyString.optional(),
    REFRESH_TOKEN_NAME: nonEmptyString.optional(),
    SESSION_TOKEN_NAME: nonEmptyString.optional(),
    ACCESS_TOKEN_COOKIE_MAX_AGE: optionalNumberString,
    REFRESH_TOKEN_COOKIE_MAX_AGE: optionalNumberString,
    SESSION_COOKIE_MAX_AGE: optionalNumberString,
    SESSION_REFRESH_THRESHOLD: optionalNumberString,

  })
  .passthrough()
  .superRefine((env, ctx) => {
    if (env.JWT_SECRET === env.CSRF_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["CSRF_SECRET"],
        message: "CSRF_SECRET must be different from JWT_SECRET",
      });
    }

    if (env.NODE_ENV === "production" || env.NODE_ENV === "staging") {
      if (!env.DOMAIN) {
        ctx.addIssue({
          code: "custom",
          path: ["DOMAIN"],
          message: "DOMAIN is required in production and staging",
        });
      } else if (!httpsUrl.safeParse(env.DOMAIN).success) {
        ctx.addIssue({
          code: "custom",
          path: ["DOMAIN"],
          message: "DOMAIN must be HTTPS in production and staging",
        });
      }

      if (!env.REDIS_URL) {
        ctx.addIssue({
          code: "custom",
          path: ["REDIS_URL"],
          message: "REDIS_URL is required in production and staging",
        });
      }

      if (!env.RABBITMQ_URL) {
        ctx.addIssue({
          code: "custom",
          path: ["RABBITMQ_URL"],
          message: "RABBITMQ_URL is required in production and staging",
        });
      }

      // if (!env.ABSTRACT_API_KEY) {
      //   ctx.addIssue({
      //     code: "custom",
      //     path: ["ABSTRACT_API_KEY"],
      //     message: "ABSTRACT_API_KEY is required in production and staging",
      //   });
      // }

      if (!httpUrl.safeParse(env.DISCORD_WEBHOOK_URL).success) {
        ctx.addIssue({
          code: "custom",
          path: ["DISCORD_WEBHOOK_URL"],
          message:
            "DISCORD_WEBHOOK_URL must be a valid HTTP(S) URL in production and staging",
        });
      }
    }
  });

export type ValidatedEnvironment = z.infer<typeof baseEnvironmentSchema>;

export class EnvironmentValidationError extends Error {
  public readonly issues: string[];

  constructor(message: string, issues: string[]) {
    super(message);
    this.name = "EnvironmentValidationError";
    this.issues = issues;
  }
}

function formatEnvironmentIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "environment";
    return `${path}: ${issue.message}`;
  });
}

export function validateEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): ValidatedEnvironment {
  const parsed = baseEnvironmentSchema.safeParse(source);

  if (!parsed.success) {
    const issues = formatEnvironmentIssues(parsed.error);
    throw new EnvironmentValidationError(
      `Invalid environment configuration: ${issues.join("; ")}`,
      issues,
    );
  }

  return parsed.data;
}

export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue!;
}

export function getEnvVarAsNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (!value) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${name} is required but not set`);
    }
    return defaultValue;
  }
  const numValue = parseInt(value, 10);
  if (Number.isNaN(numValue)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return numValue;
}

export function getEnvVarAsBoolean(
  name: string,
  defaultValue?: boolean,
): boolean {
  const value = process.env[name];
  if (!value) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${name} is required but not set`);
    }
    return defaultValue;
  }
  return value.toLowerCase() === "true";
}

// Typed environment getters with defaults
export const env = {
  PORT: () => getEnvVarAsNumber("PORT", 8000),
  NODE_ENV: () => getEnvVar("NODE_ENV", "development"),
  DOMAIN: () => getEnvVar("DOMAIN", "http://localhost:8000"),
  COMMON_BASE: () => getEnvVar("COMMON_BASE", "localhost"),
  API_KEY: () => getEnvVar("API_KEY"),

  DATABASE_URL: () => getEnvVar("DATABASE_URL"),

  DISCORD_WEBHOOK_URL: () => getEnvVar("DISCORD_WEBHOOK_URL"),

  REDIS_URL: () => getEnvVar("REDIS_URL", "redis://localhost:6379"),
  RABBITMQ_URL: () => getEnvVar("RABBITMQ_URL", "amqp://localhost:5672"),

  JWT_SECRET: () => getEnvVar("JWT_SECRET"),
  CSRF_SECRET: () => getEnvVar("CSRF_SECRET"),
  ACCESS_TOKEN_NAME: () => getEnvVar("ACCESS_TOKEN_NAME", "access_token"),
  REFRESH_TOKEN_NAME: () => getEnvVar("REFRESH_TOKEN_NAME", "refresh_token"),

  EMAIL_HOST: () => getEnvVar("EMAIL_HOST"),
  EMAIL_USER: () => getEnvVar("EMAIL_USER"),
  EMAIL_FROM: () => getEnvVar("EMAIL_FROM"),
  RESEND_USER: () => getEnvVar("RESEND_USER"),
  RESEND_PASSWORD: () => getEnvVar("RESEND_PASSWORD"),

  GOOGLE_CLIENT_ID: () => getEnvVar("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: () => getEnvVar("GOOGLE_CLIENT_SECRET"),
  LINKEDIN_CLIENT_ID: () => getEnvVar("LINKEDIN_CLIENT_ID"),
  LINKEDIN_CLIENT_SECRET: () => getEnvVar("LINKEDIN_CLIENT_SECRET"),

  // ABSTRACT_API_KEY: () => getEnvVar("ABSTRACT_API_KEY"),
};
