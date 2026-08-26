import { RequestHandler, Router } from "express";
import {
  createPermissionsController,
  getSinglePermissionController,
  listAllPermissionsController,
  updateSinglePermissionController,
} from "@/modules/user-management/F6001-permissions/controllers/permissions.controller";
import { rateLimitingOnIndividualUserAndIp } from "@/middleware/rate-limit.middleware";
import { RATELIMITING_VALUES } from "@/constants/rate-limiting-values";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { hasPermission } from "@/middleware/permission.middleware";
import { csrfProtection } from "@/middleware/csrf.middleware";
import { PERMISSIONS } from "@repo/constants";
import { ROUTE_ACCESS_TYPE } from "@/constants/variables";

const router = Router();

router.get(
  "/",
  isAuthenticated(),
  hasPermission(
    PERMISSIONS.ADMIN.READ_PERMISSION,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  listAllPermissionsController as RequestHandler,
);
router.get(
  "/:id",
  isAuthenticated(),
  hasPermission(
    PERMISSIONS.ADMIN.READ_PERMISSION,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  getSinglePermissionController as RequestHandler,
);
router.post(
  "/",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.ADMIN.CREATE_PERMISSION,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(
    RATELIMITING_VALUES.ADMIN.CREATE_PERMISSION,
  ),
  createPermissionsController as RequestHandler,
);
router.patch(
  "/:id",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.ADMIN.UPDATE_PERMISSION,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(
    RATELIMITING_VALUES.ADMIN.UPDATE_PERMISSION,
  ),
  updateSinglePermissionController as RequestHandler,
);

export default router;
