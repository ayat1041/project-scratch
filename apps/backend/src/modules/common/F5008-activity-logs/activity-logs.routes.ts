import { Router } from "express";
import {
  getActivityLogsController,
  getUserActivityLogsController,
  getRecordActivityLogsController,
} from "./controllers/activity-logs.controller";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { captureClientInfo } from "@/middleware/activity-logger.middleware";

const router = Router();

// Apply authentication and client info capture to all routes
router.use(isAuthenticated);
router.use(captureClientInfo);

// Activity logs routes
router.get("/", getActivityLogsController);
router.get("/user/:userId", getUserActivityLogsController);
router.get("/record", getRecordActivityLogsController);

export default router;
