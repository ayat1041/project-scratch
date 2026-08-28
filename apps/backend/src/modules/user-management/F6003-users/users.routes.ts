import { RequestHandler, Router } from "express";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { hasPermission } from "@/middleware/permission.middleware";
import { csrfProtection } from "@/middleware/csrf.middleware";
import { rateLimitingOnIndividualUserAndIp } from "@/middleware/rate-limit.middleware";
import { RATELIMITING_VALUES } from "@/constants/rate-limiting-values";
import { ROUTE_ACCESS_TYPE } from "@/constants/variables";
import { PERMISSIONS } from "@repo/constants";
import {
  bulkUpdateUserStatusController,
  createUserController,
  getUserController,
  listUsersController,
  updateUserRolesController,
  updateUserStatusController,
} from "@/modules/user-management/F6003-users/controllers/users.controller";

const router = Router();

router.get(
  "/",
  isAuthenticated(),
  hasPermission(PERMISSIONS.ADMIN.READ_USER, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  listUsersController as RequestHandler,
);

router.get(
  "/:id",
  isAuthenticated(),
  hasPermission(PERMISSIONS.ADMIN.READ_USER, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  getUserController as RequestHandler,
);

router.post(
  "/",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.ADMIN.CREATE_USER, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.USER_MANAGEMENT.CREATE_USER),
  createUserController as RequestHandler,
);

router.put(
  "/:id/roles",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.ADMIN.UPDATE_USER, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.USER_MANAGEMENT.UPDATE_USER_ROLES),
  updateUserRolesController as RequestHandler,
);

// Bulk status change — flat path, no :id param, body: { ids: string[], isDeleted: boolean }
router.patch(
  "/status",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.ADMIN.UPDATE_USER,
    PERMISSIONS.ADMIN.DELETE_USER,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.USER_MANAGEMENT.UPDATE_USER_STATUS),
  bulkUpdateUserStatusController as RequestHandler,
);

router.patch(
  "/:id/status",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.ADMIN.UPDATE_USER,
    PERMISSIONS.ADMIN.DELETE_USER,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.USER_MANAGEMENT.UPDATE_USER_STATUS),
  updateUserStatusController as RequestHandler,
);

export default router;
