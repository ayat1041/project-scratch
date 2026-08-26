import { IS_PRODUCTION } from "@/constants/variables";
import { logger } from "@/infrastructure/monitoring/logger";
import { QUEUE_BINDINGS } from "@/infrastructure/events/rabbitmq-topology";
import { getQueueDepth } from "@/infrastructure/events/rabbitmq-management";
import * as cron from "node-cron";

interface CronJobConfig {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  enabled: boolean;
  description?: string;
}

class CronManager {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private jobConfigs: Map<string, CronJobConfig> = new Map();
  private isProduction = IS_PRODUCTION;

  constructor() {
    this.setupCronJobs();
  }

  /**
   * Setup all cron jobs
   */
  private setupCronJobs() {
    // Example cron jobs - you can add more as needed
    const cronJobs: CronJobConfig[] = [
      {
        name: "healthCheck",
        schedule: "*/5 * * * *", // Every 5 minutes
        handler: this.healthCheckJob,
        enabled: true,
        description: "System health check and monitoring",
      },
      {
        name: "cleanupOldLogs",
        schedule: "0 2 * * *", // Daily at 2 AM
        handler: this.cleanupLogsJob,
        enabled: this.isProduction,
        description: "Clean up old log files and temporary data",
      },
      {
        name: "databaseMaintenance",
        schedule: "0 3 * * 0", // Weekly on Sunday at 3 AM
        handler: this.databaseMaintenanceJob,
        enabled: this.isProduction,
        description: "Database maintenance and optimization",
      },
      {
        name: "emailQueueCleanup",
        schedule: "0 1 * * *", // Daily at 1 AM
        handler: this.emailQueueCleanupJob,
        enabled: true,
        description: "Clean up completed and failed email queue jobs",
      },
      {
        name: "dlqDepthCheck",
        schedule: "*/5 * * * *", // Every 5 minutes
        handler: this.dlqDepthCheckJob,
        enabled: true,
        description:
          "Poll RabbitMQ DLQ depth via the management API and log an error when messages are stuck (only signal until a Grafana alert rule is wired up on top of it)",
      },
    ];

    // Register all cron jobs
    cronJobs.forEach((job) => this.registerJob(job));
  }

  /**
   * Register a new cron job
   */
  private registerJob(config: CronJobConfig) {
    if (!config.enabled) {
      logger.info(
        `Cron job '${config.name}' is disabled, skipping registration`,
      );
      return;
    }

    try {
      const task = cron.schedule(
        config.schedule,
        async () => {
          const startTime = Date.now();
          logger.info(`Starting cron job: ${config.name}`);

          try {
            await config.handler();
            const duration = Date.now() - startTime;
            logger.info(
              `Cron job '${config.name}' completed successfully in ${duration}ms`,
            );
          } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(
              `Cron job '${config.name}' failed after ${duration}ms:`,
              error,
            );
          }
        },
        {
          timezone: "America/New_York", // Set your timezone
        },
      );

      this.jobs.set(config.name, task);
      this.jobConfigs.set(config.name, config);

      logger.info(
        `Registered cron job: ${config.name} (${config.schedule}) - ${config.description}`,
      );
    } catch (error) {
      logger.error(`Failed to register cron job '${config.name}':`, error);
    }
  }

  /**
   * Start all cron jobs
   */
  public startAll() {
    logger.info("Starting all cron jobs...");
    let startedCount = 0;

    this.jobs.forEach((task, name) => {
      try {
        task.start();
        startedCount++;
        logger.info(`Started cron job: ${name}`);
      } catch (error) {
        logger.error(`Failed to start cron job '${name}':`, error);
      }
    });

    logger.info(`Started ${startedCount}/${this.jobs.size} cron jobs`);
  }

  /**
   * Stop all cron jobs
   */
  public stopAll() {
    logger.info("Stopping all cron jobs...");
    let stoppedCount = 0;

    this.jobs.forEach((task, name) => {
      try {
        task.stop();
        stoppedCount++;
        logger.info(`Stopped cron job: ${name}`);
      } catch (error) {
        logger.error(`Failed to stop cron job '${name}':`, error);
      }
    });

    logger.info(`Stopped ${stoppedCount}/${this.jobs.size} cron jobs`);
  }

  /**
   * Start a specific cron job
   */
  public start(name: string): boolean {
    const task = this.jobs.get(name);
    if (!task) {
      logger.warn(`Cron job '${name}' not found`);
      return false;
    }

    try {
      task.start();
      logger.info(`Started cron job: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to start cron job '${name}':`, error);
      return false;
    }
  }

  /**
   * Stop a specific cron job
   */
  public stop(name: string): boolean {
    const task = this.jobs.get(name);
    if (!task) {
      logger.warn(`Cron job '${name}' not found`);
      return false;
    }

    try {
      task.stop();
      logger.info(`Stopped cron job: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to stop cron job '${name}':`, error);
      return false;
    }
  }

  /**
   * Get status of all cron jobs
   */
  public getStatus(): Record<
    string,
    {
      enabled: boolean;
      running: boolean;
      schedule: string;
      description?: string;
    }
  > {
    const status: Record<
      string,
      {
        enabled: boolean;
        running: boolean;
        schedule: string;
        description?: string;
      }
    > = {};

    this.jobConfigs.forEach((config, name) => {
      const task = this.jobs.get(name);
      status[name] = {
        enabled: config.enabled,
        running: task ? task.getStatus() === "scheduled" : false,
        schedule: config.schedule,
        description: config.description,
      };
    });

    return status;
  }

  /**
   * Add a new cron job dynamically
   */
  public addJob(config: CronJobConfig): boolean {
    if (this.jobs.has(config.name)) {
      logger.warn(`Cron job '${config.name}' already exists`);
      return false;
    }

    this.registerJob(config);
    if (config.enabled) {
      return this.start(config.name);
    }
    return true;
  }

  /**
   * Remove a cron job
   */
  public removeJob(name: string): boolean {
    const task = this.jobs.get(name);
    if (!task) {
      logger.warn(`Cron job '${name}' not found`);
      return false;
    }

    try {
      task.stop();
      task.destroy();
      this.jobs.delete(name);
      this.jobConfigs.delete(name);
      logger.info(`Removed cron job: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to remove cron job '${name}':`, error);
      return false;
    }
  }

  // ======================
  // CRON JOB HANDLERS
  // ======================

  /**
   * Health check job - monitors system health
   */
  private healthCheckJob = async (): Promise<void> => {
    try {
      // You can integrate with your health monitoring service here
      logger.info("Running health check...");

      // Example health checks:
      // - Check database connection
      // - Check Redis connection
      // - Check worker status
      // - Check disk space
      // - Check memory usage

      // For now, just log that the health check ran
      logger.info("Health check completed successfully");
    } catch (error) {
      logger.error("Health check failed:", error);
      throw error;
    }
  };

  /**
   * Cleanup old logs and temporary files
   */
  private cleanupLogsJob = async (): Promise<void> => {
    try {
      logger.info("Running log cleanup...");

      // Here you can add logic to:
      // - Delete old log files
      // - Clean up temporary files
      // - Archive old data
      // - Clean up old sessions

      logger.info("Log cleanup completed successfully");
    } catch (error) {
      logger.error("Log cleanup failed:", error);
      throw error;
    }
  };

  /**
   * Database maintenance job
   */
  private databaseMaintenanceJob = async (): Promise<void> => {
    try {
      logger.info("Running database maintenance...");

      // Here you can add logic to:
      // - Run VACUUM on PostgreSQL
      // - Update table statistics
      // - Clean up expired sessions
      // - Archive old data
      // - Optimize database performance

      logger.info("Database maintenance completed successfully");
    } catch (error) {
      logger.error("Database maintenance failed:", error);
      throw error;
    }
  };

  /**
   * Clean up email queue jobs
   */
  private emailQueueCleanupJob = async (): Promise<void> => {
    try {
      logger.info("Running email queue cleanup...");

      // Here you can add logic to:
      // - Clean up completed email jobs
      // - Retry failed email jobs
      // - Archive old email logs
      // - Update email statistics

      logger.info("Email queue cleanup completed successfully");
    } catch (error) {
      logger.error("Email queue cleanup failed:", error);
      throw error;
    }
  };

  /**
   * Poll each RabbitMQ DLQ's depth. A message reaching a DLQ means retries
   * were exhausted (see rabbitmq-topology.ts) and needs a human to look at
   * it — logger.error ships to Loki in staging/prod (logger.ts), so this
   * closes the "only discoverable by manually inspecting the queue" gap.
   * An actual page/alert still needs a Grafana alert rule on this log line.
   */
  private dlqDepthCheckJob = async (): Promise<void> => {
    for (const binding of QUEUE_BINDINGS) {
      const dlqName = `${binding.queue}.dlq`;
      try {
        const depth = await getQueueDepth(dlqName);
        if (depth > 0) {
          logger.error(
            `DLQ depth alert: "${dlqName}" has ${depth} message(s) awaiting manual review`,
            { queue: dlqName, depth },
          );
        }
      } catch (error) {
        logger.error(`Failed to check DLQ depth for "${dlqName}"`, { error });
      }
    }
  };
}

export const CRON_MANAGER = new CronManager();
export default CRON_MANAGER;
