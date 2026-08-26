// Required imports for module alias and tracing - MUST BE FIRST
import "module-alias/register";

import { validateEnvironment } from "@/utils/environment";
import { IS_DEVELOPMENT } from "./constants/variables";

async function startServer(): Promise<void> {
  let logger:
    | typeof import("@/infrastructure/monitoring/logger").logger
    | undefined;

  try {
    // Validate env before importing modules that read process.env at module load.
    validateEnvironment();

    const tracing = await import("@/infrastructure/monitoring/tracing");
    tracing.sdk.start();

    const appLogger = (await import("@/infrastructure/monitoring/logger"))
      .logger;
    logger = appLogger;
    const { createApp } = await import("@/app/app");
    const { serverConfig } = await import("@/config/server");
    const { CRON_MANAGER } =
      await import("@/modules/platform/F9001-cron-jobs/services/cron-manager.service");

    // Test critical dependencies before starting the server
    // await testRedisConnection();

    // // Start background workers
    // WORKER_MANAGER.startAll();

    // Start cron jobs
    // CRON_MANAGER.startAll();

    // create a storage folder to root if not exists
    // await fs.mkdir(path.resolve(__dirname, "../storage"), { recursive: true });

    // Create Express application
    const app = createApp();

    // Start the HTTP server only after all dependencies are ready
    const server = app.listen(serverConfig.port, "0.0.0.0", () => {
      if (IS_DEVELOPMENT) {
        console.log(
          `Server is running at http://localhost:${serverConfig.port}`,
        );
      }
      appLogger.info(
        `Server is running at http://localhost:${serverConfig.port}`,
      );
    });

    // Keep-alive timeout must exceed the reverse proxy (nginx default 60s)
    // to avoid 502s when nginx sends a request on a connection Node has closed.
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      appLogger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        appLogger.info("HTTP server closed.");

        // Stop cron jobs
        CRON_MANAGER.stopAll();

        // Stop workers
        // await WORKER_MANAGER.stopAll();
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        appLogger.error("Forceful shutdown after 30 seconds");
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    // Per Express best practices: do NOT attempt async cleanup after an
    // uncaughtException — process state is corrupted. Log and exit immediately
    // so the process manager (Docker) can restart to a clean state.
    process.on("uncaughtException", (error) => {
      appLogger.error("Uncaught Exception — exiting immediately:", error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      appLogger.error("Unhandled Rejection at:", { promise, reason });
      process.exit(1);
    });
  } catch (error) {
    if (logger) {
      logger.error("Failed to start server:", error);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Failed to start server: ${message}\n`);
    }
    process.exit(1);
  }
}

// Start the application
startServer();
