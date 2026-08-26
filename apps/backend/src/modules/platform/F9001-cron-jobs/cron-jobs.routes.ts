import { Router } from "express";
import {
  getCronJobsStatus,
  startAllCronJobs,
  stopAllCronJobs,
  startCronJob,
  stopCronJob,
  getCronJobStatus,
} from "@/modules/platform/F9001-cron-jobs/controllers/cron-jobs.controller";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { hasPermission } from "@/middleware/permission.middleware";
import { csrfProtection } from "@/middleware/csrf.middleware";

const router = Router();
// All cron job routes require authentication and admin permissions
router.use(isAuthenticated());
router.use(hasPermission("cron_jobs:read")); // At minimum, need read permission
router.use(csrfProtection());

// Get status of all cron jobs
router.get("/", getCronJobsStatus);

// Get status of a specific cron job
router.get("/:jobName", getCronJobStatus);

// Start all cron jobs (requires write permission)
router.post("/start-all", hasPermission("cron_jobs:write"), startAllCronJobs);

// Stop all cron jobs (requires write permission)
router.post("/stop-all", hasPermission("cron_jobs:write"), stopAllCronJobs);

// Start a specific cron job (requires write permission)
router.post("/:jobName/start", hasPermission("cron_jobs:write"), startCronJob);

// Stop a specific cron job (requires write permission)
router.post("/:jobName/stop", hasPermission("cron_jobs:write"), stopCronJob);

export default router;
