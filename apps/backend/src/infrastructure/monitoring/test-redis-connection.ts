/* eslint-disable @typescript-eslint/no-explicit-any */
import { env } from "@/utils/environment";
import Redis, { RedisOptions } from "ioredis";
import { logger } from "@/infrastructure/monitoring/logger";

const createConnectionError = (message: string, cause?: unknown) => ({
  name: "RedisConnectionError",
  message,
  cause,
});

const createAuthError = (message: string, cause?: unknown) => ({
  name: "RedisAuthError",
  message,
  cause,
});

const createTimeoutError = (message: string, cause?: unknown) => ({
  name: "RedisTimeoutError",
  message,
  cause,
});

// Helper to check if something is an Error object
const isError = (err: unknown): err is Error & { code?: string } =>
  err instanceof Error;

// Helper to categorize errors
const categorizeError = (error: unknown) => {
  if (isError(error)) {
    if (error.code === "ECONNREFUSED") {
      const url = new URL(env.REDIS_URL());
      return createConnectionError(
        `Failed to connect to Redis: Connection refused at ${url.hostname}:${url.port || "6379"}`,
        error,
      );
    }
    if (error.message.includes("NOAUTH")) {
      return createAuthError(
        "Failed to authenticate with Redis: Invalid username or password",
        error,
      );
    }
    if (error.message.includes("timeout")) {
      return createTimeoutError("Redis connection timed out", error);
    }
  }

  return createConnectionError(
    `Unexpected Redis error: ${isError(error) ? error.message : String(error)}`,
    error,
  );
};

// Helper to safely close Redis connection
const closeRedisConnection = async (redis: Redis) => {
  try {
    await redis.quit();
    logger.info("Redis connection closed");
  } catch (quitError: unknown) {
    logger.warn("Failed to close Redis connection:", {
      error: quitError instanceof Error ? quitError.message : String(quitError),
    });
  }
};

// Main test function
export const testRedisConnection = async () => {
  let redis: Redis | null = null;

  try {
    // Create Redis client configuration from REDIS_URL
    const url = new URL(env.REDIS_URL());
    const redisOptions: RedisOptions = {
      host: url.hostname,
      port: parseInt(url.port || "6379", 10),
      password: url.password || undefined,
      username: url.username !== "default" ? url.username : undefined,
      connectTimeout: 5000,
    };

    redis = new Redis(redisOptions);

    // Log connection attempt
    logger.info("Attempting to connect to Redis", {
      host: redisOptions.host,
      port: redisOptions.port,
    });

    // Set up error handler
    redis.on("error", (error: Error) => {
      logger.error("Redis client error:", {
        error: error.message,
        code: (error as any).code,
        syscall: (error as any).syscall,
        address: (error as any).address,
        port: (error as any).port,
      });
    });

    // Test connection
    const result = await redis.ping();
    logger.info("Redis connection test successful:", { result });

    return {
      status: "success" as const,
      message: "Redis connection established",
      result,
    };
  } catch (error: unknown) {
    const customError = categorizeError(error);

    // Log the error
    logger.error(customError.message, {
      name: customError.name,
      cause:
        customError.cause instanceof Error
          ? customError.cause.message
          : String(customError.cause),
    });

    throw new Error(`${customError.name}: ${customError.message}`);
  } finally {
    // Clean up connection
    if (redis) {
      await closeRedisConnection(redis);
    }
  }
};
