import redisClient from "@/infrastructure/cache/redis-client";
import { getDatabaseHealth } from "@/infrastructure/monitoring/test-database-connection";
import { logger } from "@/infrastructure/monitoring/logger";

export interface HealthStatus {
  status: "UP" | "DOWN" | "DEGRADED";
  message: string;
  timestamp: string;
  services: {
    database: "UP" | "DOWN";
    redis: "UP" | "DOWN";
  };
  uptime: number;
  details?: {
    database?: {
      connectionTime?: number;
      error?: string;
    };
  };
}

export type PublicHealthStatus = Pick<
  HealthStatus,
  "status" | "message" | "timestamp"
> &
  Partial<Pick<HealthStatus, "services" | "uptime" | "details">> & {
    error?: string;
  };

const publicHealthMessageByStatus: Record<HealthStatus["status"], string> = {
  UP: "Service is healthy",
  DEGRADED: "Service is unavailable",
  DOWN: "Service is unavailable",
};

export function sanitizeHealthStatusForResponse(
  healthStatus: HealthStatus,
  options: { includeDiagnostics?: boolean } = {},
): PublicHealthStatus {
  const { includeDiagnostics = false } = options;

  if (includeDiagnostics) {
    return healthStatus;
  }

  return {
    status: healthStatus.status,
    message: publicHealthMessageByStatus[healthStatus.status],
    timestamp: healthStatus.timestamp,
  };
}

export function buildHealthCheckFailureResponse(
  error: unknown,
  options: { includeDiagnostics?: boolean } = {},
): PublicHealthStatus {
  const { includeDiagnostics = false } = options;
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  return {
    status: "DOWN",
    message: "Health check failed",
    timestamp: new Date().toISOString(),
    ...(includeDiagnostics && { error: errorMessage }),
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const redisStatus = redisClient.isRedisConnected() ? "UP" : "DOWN";

  // Check database connectivity
  const databaseHealth = await getDatabaseHealth();
  const databaseStatus = databaseHealth.status;

  // Determine overall status based on all services
  const hasServiceIssues = redisStatus === "DOWN" || databaseStatus === "DOWN";
  const hasCriticalIssues = redisStatus === "DOWN" && databaseStatus === "DOWN";

  let status: "UP" | "DOWN" | "DEGRADED" = "UP";
  let message = "All services are operational";

  if (hasCriticalIssues) {
    status = "DOWN";
    message = "Multiple critical services are down";
  } else if (hasServiceIssues) {
    status = "DEGRADED";
    if (databaseStatus === "DOWN") {
      message = "Database is not connected";
    } else {
      message = "Redis is not connected";
    }
  }

  // Send health alert if there are service issues (simplified without Discord)
  if (hasServiceIssues) {
    try {
      logger.warn("Service issues detected", {
        status,
        message,
        services: {
          database: databaseStatus,
          redis: redisStatus,
        },
      });
    } catch (error) {
      logger.error("Failed to log health alert:", error);
      // Don't throw - health check should continue even if logging fails
    }
  }

  return {
    status,
    message,
    timestamp: new Date().toISOString(),
    services: {
      database: databaseStatus,
      redis: redisStatus,
    },
    uptime: process.uptime(),
    details: {
      database: databaseHealth.details,
    },
  };
}
