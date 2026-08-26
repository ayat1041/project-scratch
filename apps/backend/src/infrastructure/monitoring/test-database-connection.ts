import { db } from "@/db/db";
import { sql } from "drizzle-orm";
import { logger } from "@/infrastructure/monitoring/logger";

/**
 * Test database connectivity by running a simple query
 * @returns Promise<boolean> - true if database is connected, false otherwise
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to test connection - using SELECT 1 which is universally supported
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    logger.error("Database health check failed:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * Get detailed database connection information
 * @returns Promise with connection status and details
 */
export async function getDatabaseHealth(): Promise<{
  status: "UP" | "DOWN";
  details?: {
    connectionTime?: number;
    error?: string;
  };
}> {
  const startTime = Date.now();

  try {
    await db.execute(sql`SELECT 1`);
    const connectionTime = Date.now() - startTime;

    return {
      status: "UP",
      details: {
        connectionTime,
      },
    };
  } catch (error) {
    const connectionTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error("Database health check failed:", {
      error: errorMessage,
      connectionTime,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      status: "DOWN",
      details: {
        connectionTime,
        error: errorMessage,
      },
    };
  }
}
