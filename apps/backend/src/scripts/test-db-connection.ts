/**
 * Quick test script to verify database connectivity
 * Run with: npx ts-node src/scripts/testDbConnection.ts
 */

import "dotenv/config";
import {
  testDatabaseConnection,
  getDatabaseHealth,
} from "@/infrastructure/monitoring/test-database-connection";
import { logger } from "@/infrastructure/monitoring/logger";

async function main() {
  try {
    // Test simple connection
    const isConnected = await testDatabaseConnection();

    logger.info(
      `Database connection test result: ${isConnected ? "PASS" : "FAIL"}`,
    );

    // Test detailed health check
    const healthStatus = await getDatabaseHealth();

    logger.info(`Database health status: ${healthStatus.status}`);

    if (healthStatus.status === "UP") {
      logger.info(
        `Database is healthy! Connection time: ${healthStatus.details?.connectionTime}ms`,
      );
    } else {
      logger.error(`Database is down! Error: ${healthStatus.details?.error}`);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    logger.error("Database test script failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
