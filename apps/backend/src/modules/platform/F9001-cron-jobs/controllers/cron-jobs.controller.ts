import { Request, Response } from "express";
import { CRON_MANAGER } from "@/modules/platform/F9001-cron-jobs/services/cron-manager.service";
import { createError, handleError } from "@/middleware/error.middleware";

/**
 * Get status of all cron jobs
 */
export const getCronJobsStatus = async (req: Request, res: Response) => {
  try {
    const status = CRON_MANAGER.getStatus();
    const jobCount = Object.keys(status).length;
    const runningCount = Object.values(status).filter(
      (job) => job.running,
    ).length;

    res.status(200).json({
      success: true,
      message: "Cron jobs status retrieved successfully",
      data: {
        summary: {
          totalJobs: jobCount,
          runningJobs: runningCount,
          stoppedJobs: jobCount - runningCount,
        },
        jobs: status,
      },
    });
  } catch (error) {
    handleError(error, res, "getCronJobsStatus");
  }
};

/**
 * Start all cron jobs
 */
export const startAllCronJobs = async (req: Request, res: Response) => {
  try {
    CRON_MANAGER.startAll();
    const status = CRON_MANAGER.getStatus();
    const runningCount = Object.values(status).filter(
      (job) => job.running,
    ).length;

    res.status(200).json({
      success: true,
      message: `Started cron jobs successfully. ${runningCount} jobs are now running.`,
      data: {
        runningJobs: runningCount,
        jobs: status,
      },
    });
  } catch (error) {
    handleError(error, res, "startAllCronJobs");
  }
};

/**
 * Stop all cron jobs
 */
export const stopAllCronJobs = async (req: Request, res: Response) => {
  try {
    CRON_MANAGER.stopAll();
    const status = CRON_MANAGER.getStatus();
    const stoppedCount = Object.values(status).filter(
      (job) => !job.running,
    ).length;

    res.status(200).json({
      success: true,
      message: `Stopped cron jobs successfully. ${stoppedCount} jobs are now stopped.`,
      data: {
        stoppedJobs: stoppedCount,
        jobs: status,
      },
    });
  } catch (error) {
    handleError(error, res, "stopAllCronJobs");
  }
};

/**
 * Start a specific cron job
 */
export const startCronJob = async (req: Request, res: Response) => {
  try {
    const { jobName } = req.params as { jobName: string };

    if (!jobName) {
      throw createError.validation("Job name is required", {
        error: "Job name parameter is missing",
        hint: "Provide a valid job name in the URL path",
      });
    }

    const success = CRON_MANAGER.start(jobName);

    if (!success) {
      throw createError.notFound(`Cron job '${jobName}' not found`, {
        error: `Cron job '${jobName}' does not exist`,
        hint: "Check the job name and try again",
      });
    }

    const status = CRON_MANAGER.getStatus();
    const jobStatus = status[jobName];

    res.status(200).json({
      success: true,
      message: `Cron job '${jobName}' started successfully`,
      data: {
        jobName,
        status: jobStatus,
      },
    });
  } catch (error) {
    handleError(error, res, "startCronJob");
  }
};

/**
 * Stop a specific cron job
 */
export const stopCronJob = async (req: Request, res: Response) => {
  try {
    const { jobName } = req.params as { jobName: string };

    if (!jobName) {
      throw createError.validation("Job name is required", {
        error: "Job name parameter is missing",
        hint: "Provide a valid job name in the URL path",
      });
    }

    const success = CRON_MANAGER.stop(jobName);

    if (!success) {
      throw createError.notFound(`Cron job '${jobName}' not found`, {
        error: `Cron job '${jobName}' does not exist`,
        hint: "Check the job name and try again",
      });
    }

    const status = CRON_MANAGER.getStatus();
    const jobStatus = status[jobName];

    res.status(200).json({
      success: true,
      message: `Cron job '${jobName}' stopped successfully`,
      data: {
        jobName,
        status: jobStatus,
      },
    });
  } catch (error) {
    handleError(error, res, "stopCronJob");
  }
};

/**
 * Get status of a specific cron job
 */
export const getCronJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobName } = req.params as { jobName: string };

    if (!jobName) {
      throw createError.validation("Job name is required", {
        error: "Job name parameter is missing",
        hint: "Provide a valid job name in the URL path",
      });
    }

    const status = CRON_MANAGER.getStatus();
    const jobStatus = status[jobName];

    if (!jobStatus) {
      throw createError.notFound(`Cron job '${jobName}' not found`, {
        error: `Cron job '${jobName}' does not exist`,
        hint: "Check the job name and try again",
      });
    }

    res.status(200).json({
      success: true,
      message: `Cron job '${jobName}' status retrieved successfully`,
      data: {
        jobName,
        status: jobStatus,
      },
    });
  } catch (error) {
    handleError(error, res, "getCronJobStatus");
  }
};
