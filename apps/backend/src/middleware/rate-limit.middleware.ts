import redisClient from "@/infrastructure/cache/redis-client";
import { createError } from "@/middleware/error.middleware";
import { Request, Response, NextFunction } from "express";
import { logger } from "@/infrastructure/monitoring/logger";
import { createHash } from "crypto";

interface RateLimitOptions {
  time: number;
  maxRequests: number;
  checkEmail?: boolean;
  identityBodyFields?: string[];
}

interface RateLimitCounter {
  requests: number;
  ttl: number;
}

const RATE_LIMIT_KEY_PREFIX = "rate-limit";
const RAPID_WINDOW_SECONDS = 10;
const RAPID_ALERT_THRESHOLDS = new Set([100, 250, 500]);
const RAPID_MAX_REQUESTS = 500;
const TEMPORARY_BAN_SECONDS = 60 * 60;
const MAX_MEMORY_COUNTERS = 10000;

const memoryCounters = new Map<
  string,
  { requests: number; expiresAt: number }
>();
const memoryBans = new Map<string, number>();

// Secure IP detection helper function
// With `trust proxy = 1` set in app, Express resolves req.ip from
// X-Forwarded-For correctly. Do NOT read raw headers — they can be spoofed.
function getClientIP(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "127.0.0.1";
}

function hashKeyPart(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalizedEmail = value.trim().toLowerCase();
  return normalizedEmail.length > 0 ? normalizedEmail : null;
}

function normalizeBodyIdentity(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function getRouteScope(req: Request): string {
  const routePath = req.route?.path;
  const normalizedRoutePath = Array.isArray(routePath)
    ? routePath.map(String).join("|")
    : routePath
      ? String(routePath)
      : req.path;

  return `${req.method}:${req.baseUrl}${normalizedRoutePath}`;
}

function getUserIdFromLocals(res: Response): string | null {
  const userId = res.locals.userId;

  if (typeof userId === "string" && userId.trim()) return userId.trim();
  if (typeof userId === "number") return String(userId);

  return null;
}

function getRouteIdentityKey(
  req: Request,
  res: Response,
  {
    checkEmail,
    identityBodyFields = [],
  }: Pick<RateLimitOptions, "checkEmail" | "identityBodyFields">,
): string {
  const requestIdentityFields = new Set([
    ...(checkEmail ? ["email"] : []),
    ...identityBodyFields,
  ]);

  for (const field of requestIdentityFields) {
    const rawValue = req.body?.[field];
    const normalizedValue =
      field === "email"
        ? normalizeEmail(rawValue)
        : normalizeBodyIdentity(rawValue);

    if (normalizedValue) {
      return `${field}:${hashKeyPart(normalizedValue)}`;
    }
  }

  const userId = getUserIdFromLocals(res);
  if (userId) return `user:${hashKeyPart(userId)}`;

  return "anonymous";
}

function buildRouteRateLimitKey(
  req: Request,
  res: Response,
  options: Pick<RateLimitOptions, "checkEmail" | "identityBodyFields">,
): string {
  const ip = getClientIP(req);
  const routeScope = getRouteScope(req);
  const identityKey = getRouteIdentityKey(req, res, options);

  return [
    RATE_LIMIT_KEY_PREFIX,
    "route",
    hashKeyPart(routeScope),
    `ip:${hashKeyPart(ip)}`,
    identityKey,
  ].join(":");
}

function buildIpRateLimitKey(req: Request): string {
  return [RATE_LIMIT_KEY_PREFIX, "ip", hashKeyPart(getClientIP(req))].join(":");
}

function normalizeTtl(ttl: number, fallback: number): number {
  return ttl > 0 ? ttl : fallback;
}

function pruneExpiredMemoryCounters(now: number): void {
  for (const [key, counter] of memoryCounters.entries()) {
    if (counter.expiresAt <= now) {
      memoryCounters.delete(key);
    }
  }
}

function incrementMemoryCounter(
  key: string,
  windowSeconds: number,
): RateLimitCounter {
  const now = Date.now();
  const existingCounter = memoryCounters.get(key);

  if (!existingCounter || existingCounter.expiresAt <= now) {
    if (memoryCounters.size >= MAX_MEMORY_COUNTERS) {
      pruneExpiredMemoryCounters(now);
    }

    const expiresAt = now + windowSeconds * 1000;
    memoryCounters.set(key, { requests: 1, expiresAt });

    return { requests: 1, ttl: windowSeconds };
  }

  existingCounter.requests += 1;

  return {
    requests: existingCounter.requests,
    ttl: Math.ceil((existingCounter.expiresAt - now) / 1000),
  };
}

async function incrementRateLimitCounter(
  key: string,
  windowSeconds: number,
): Promise<RateLimitCounter> {
  if (!redisClient.isRedisConnected()) {
    return incrementMemoryCounter(key, windowSeconds);
  }

  const requests = await redisClient.increment(key);
  if (requests <= 0) {
    return incrementMemoryCounter(key, windowSeconds);
  }

  if (requests === 1) {
    await redisClient.expire(key, windowSeconds);
    return { requests, ttl: windowSeconds };
  }

  const ttl = await redisClient.ttl(key);
  if (ttl <= 0) {
    await redisClient.expire(key, windowSeconds);
    return { requests, ttl: windowSeconds };
  }

  return { requests, ttl };
}

function getMemoryBanTtl(key: string): number | null {
  const expiresAt = memoryBans.get(key);
  if (!expiresAt) return null;

  const now = Date.now();
  if (expiresAt <= now) {
    memoryBans.delete(key);
    return null;
  }

  return Math.ceil((expiresAt - now) / 1000);
}

async function getBanTtl(key: string): Promise<number | null> {
  const memoryBanTtl = getMemoryBanTtl(key);
  if (memoryBanTtl) return memoryBanTtl;

  if (!redisClient.isRedisConnected()) return null;

  const isBanned = await redisClient.get(key);
  if (!isBanned) return null;

  const ttl = await redisClient.ttl(key);
  return normalizeTtl(ttl, TEMPORARY_BAN_SECONDS);
}

async function setTemporaryBan(key: string): Promise<void> {
  memoryBans.set(key, Date.now() + TEMPORARY_BAN_SECONDS * 1000);

  if (!redisClient.isRedisConnected()) return;

  try {
    await redisClient.set(key, "rapid-rate-limit", TEMPORARY_BAN_SECONDS);
  } catch (error) {
    logger.error("Redis temporary ban write failed:", error);
  }
}

function throwRateLimitExceeded(
  res: Response,
  ttl: number,
  fallbackTtl: number,
  rawResponse: number,
): never {
  const retryAfter = normalizeTtl(ttl, fallbackTtl);
  res.setHeader("Retry-After", String(retryAfter));

  throw createError.rateLimit(
    `Rate limit exceeded. Try again in ${retryAfter} seconds`,
    {
      error: `Rate limit exceeded. Try again in ${retryAfter} seconds`,
      hint: "Please try again after some time.",
      rawResponse,
    },
  );
}

export function rateLimitingOnIndividualIp({
  time,
  maxRequests,
}: RateLimitOptions) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      // Do NOT exempt crawlers here — User-Agent is trivially spoofed and
      // legitimate crawlers never hit auth/API endpoints.
      const key = buildIpRateLimitKey(req);
      const { requests, ttl } = await incrementRateLimitCounter(key, time);

      if (requests > maxRequests) {
        throwRateLimitExceeded(res, ttl, time, requests);
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}

export function rateLimitingOnIndividualUserAndIp({
  time,
  maxRequests,
  checkEmail = false,
  identityBodyFields,
}: RateLimitOptions) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const key = buildRouteRateLimitKey(req, res, {
        checkEmail,
        identityBodyFields,
      });
      const { requests, ttl } = await incrementRateLimitCounter(key, time);

      if (requests > maxRequests) {
        throwRateLimitExceeded(res, ttl, time, requests);
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}

// Multi-tier rate limiting with DDoS detection
export function globalRateLimiting({ time, maxRequests }: RateLimitOptions) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const ip = getClientIP(req);
      const ipHash = hashKeyPart(ip);
      const bannedKey = `${RATE_LIMIT_KEY_PREFIX}:banned:${ipHash}`;

      const banTtl = await getBanTtl(bannedKey);
      if (banTtl) {
        res.setHeader("Retry-After", String(banTtl));

        throw createError.rateLimit(
          `IP temporarily banned due to suspicious activity. Try again in ${banTtl} seconds`,
          {
            error: "IP temporarily banned due to suspicious activity.",
            hint: "Please contact support if you believe this is an error.",
            rawResponse: banTtl,
          },
        );
      }

      // DDoS Detection: Track rapid successive requests
      const rapidKey = `${RATE_LIMIT_KEY_PREFIX}:rapid:${ipHash}`;
      const { requests: rapidCount } = await incrementRateLimitCounter(
        rapidKey,
        RAPID_WINDOW_SECONDS,
      );

      if (RAPID_ALERT_THRESHOLDS.has(rapidCount)) {
        logger.warn(
          `Rapid request threshold reached for IP ${ip}: ${rapidCount} requests in ${RAPID_WINDOW_SECONDS} seconds`,
        );
      }

      if (rapidCount > RAPID_MAX_REQUESTS) {
        // Temporarily ban IP for 1 hour
        await setTemporaryBan(bannedKey);
        res.setHeader("Retry-After", String(TEMPORARY_BAN_SECONDS));

        throw createError.rateLimit(
          "Suspicious activity detected. IP temporarily banned.",
          {
            error: "Suspicious activity detected. IP temporarily banned.",
            hint: "Please contact support if you believe this is an error.",
            rawResponse: rapidCount,
          },
        );
      }

      // Regular rate limiting
      const globalKey = `${RATE_LIMIT_KEY_PREFIX}:global:${ipHash}`;
      const { requests, ttl } = await incrementRateLimitCounter(
        globalKey,
        time,
      );

      if (requests > maxRequests) {
        logger.warn(
          `Rate limit exceeded for IP ${ip}: ${requests} requests in ${time} seconds`,
        );
        throwRateLimitExceeded(res, ttl, time, requests);
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}
