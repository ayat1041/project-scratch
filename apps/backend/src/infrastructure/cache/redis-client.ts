import Redis from "ioredis";
import { logger } from "@/infrastructure/monitoring/logger";

class RedisService {
  /**
   * Get all fields and values from a hash (hgetall)
   * Usage: await RedisService.hgetall(key)
   */
  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      if (!this.client.status || this.client.status !== "ready") {
        logger.warn("Redis not connected, skipping hgetall operation");
        return null;
      }
      return await this.client.hgetall(key);
    } catch (error) {
      logger.error("Redis hgetall operation failed:", error);
      return null;
    }
  }
  /**
   * Set multiple fields in a hash (hmset)
   * Usage: await RedisService.hmset(key, { field1: value1, field2: value2 })
   */
  async hmset(
    key: string,
    data: Record<string, string | number | boolean>,
  ): Promise<"OK" | null> {
    try {
      if (!this.client.status || this.client.status !== "ready") {
        logger.warn("Redis not connected, skipping hmset operation");
        return null;
      }
      // Convert all values to strings for Redis
      const flatData: Array<string> = [];
      for (const [field, value] of Object.entries(data)) {
        flatData.push(field, String(value));
      }
      return await this.client.hmset(key, ...flatData);
    } catch (error) {
      logger.error("Redis hmset operation failed:", error);
      return null;
    }
  }
  /**
   * Set a lock key with PX (milliseconds expiration) and NX (only set if not exists)
   * Returns 'OK' if lock acquired, null otherwise
   */
  async setLock(
    key: string,
    value: string,
    ttlMs: number,
  ): Promise<string | null> {
    try {
      if (!this.client.status || this.client.status !== "ready") {
        logger.warn("Redis not connected, skipping setLock operation");
        return null;
      }
      // PX: expire in ms, NX: only set if not exists
      return await this.client.set(key, value, "PX", ttlMs, "NX");
    } catch (error) {
      logger.error("Redis setLock operation failed:", error);
      return null;
    }
  }
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    const redisConfig = this.getRedisConfig();

    this.client = new Redis({
      ...redisConfig,
      maxRetriesPerRequest: 3,
      lazyConnect: true, // Don't connect immediately
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    this.setupEventHandlers();
    this.connect();
  }

  private getRedisConfig() {
    // REDIS_URL is required by the environment schema — no discrete
    // host/port/password fallback needed.
    const url = new URL(process.env.REDIS_URL!);
    return {
      host: url.hostname,
      port: parseInt(url.port || "6379", 10),
      password: url.password || undefined,
      username: url.username !== "default" ? url.username : undefined,
    };
  }

  private setupEventHandlers() {
    this.client.on("connect", () => {
      logger.info("Redis connected successfully");
      this.isConnected = true;
    });

    this.client.on("ready", () => {
      logger.info("Redis ready to receive commands");
    });

    this.client.on("error", (err) => {
      logger.error(`Redis Client Error: ${err.message}`);
      this.isConnected = false;
      // Don't throw here, let individual operations handle errors
    });

    this.client.on("close", () => {
      logger.warn("Redis connection closed");
      this.isConnected = false;
    });

    this.client.on("reconnecting", () => {
      logger.info("Redis reconnecting...");
    });
  }

  private async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error("Failed to connect to Redis:", error);
      // Don't throw here, allow the app to continue without Redis
    }
  }

  async set(
    key: string,
    value: unknown,
    expirationInSeconds?: number,
  ): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Redis not connected, skipping set operation");
      return;
    }

    try {
      const stringValue = JSON.stringify(value);
      if (expirationInSeconds) {
        await this.client.set(key, stringValue, "EX", expirationInSeconds);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      logger.error("Redis set operation failed:", error);
      throw error;
    }
  }

  async get(key: string): Promise<unknown> {
    if (!this.isConnected) {
      logger.warn("Redis not connected, returning null for get operation");
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Redis get operation failed:", error);
      return null; // Return null instead of throwing
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Redis not connected, skipping delete operation");
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error("Redis delete operation failed:", error);
    }
  }

  async invalidateUserPermissions(userId: string): Promise<void> {
    await this.del(`user:permissions:${userId}`);
  }

  async increment(key: string): Promise<number> {
    if (!this.isConnected) {
      logger.warn("Redis not connected, returning 0 for increment operation");
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error("Redis increment operation failed:", error);
      return 0;
    }
  }

  async expire(key: string, expirationInSeconds: number): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Redis not connected, skipping expire operation");
      return;
    }

    try {
      await this.client.expire(key, expirationInSeconds);
    } catch (error) {
      logger.error("Redis expire operation failed:", error);
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      logger.warn("Redis not connected, returning -1 for TTL operation");
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error("Redis TTL operation failed:", error);
      return -1;
    }
  }

  // delete cache by prefix: using scan
  async deleteKeysByPrefix(prefix: string): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Redis not connected, skipping delete by prefix operation");
      return;
    }

    try {
      const stream = this.client.scanStream({
        match: `${prefix}*`,
        count: 100,
      });

      for await (const keys of stream) {
        if (keys.length) {
          await this.client.del(...keys);
        }
      }
    } catch (error) {
      logger.error("Redis delete by prefix operation failed:", error);
    }
  }

  // Health check methods
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  async ping(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      logger.error("Redis ping failed:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      logger.info("Redis disconnected successfully");
    } catch (error) {
      logger.error("Error disconnecting from Redis:", error);
    }
  }
}

export default new RedisService();
