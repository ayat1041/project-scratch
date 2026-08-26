import { Router, RequestHandler } from "express";
import {
  createRolesController,
  deleteSingleRoleController,
  getSingleRoleController,
  listAllRolesController,
  updateSingleRoleController,
} from "@/modules/user-management/F6002-roles/controllers/roles.controller";
import { hasPermission } from "@/middleware/permission.middleware";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { rateLimitingOnIndividualUserAndIp } from "@/middleware/rate-limit.middleware";
import { RATELIMITING_VALUES } from "@/constants/rate-limiting-values";
import { PERMISSIONS } from "@repo/constants";
import { csrfProtection } from "@/middleware/csrf.middleware";
import { ROUTE_ACCESS_TYPE } from "@/constants/variables";

const router = Router();
router.get(
  "/",
  isAuthenticated(),
  hasPermission(
    PERMISSIONS.ADMIN.READ_ROLE,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  listAllRolesController as RequestHandler,
);
router.get(
  "/:id",
  isAuthenticated(),
  hasPermission(
    PERMISSIONS.ADMIN.READ_ROLE,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  getSingleRoleController as RequestHandler,
);

router.post(
  "/",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.ADMIN.CREATE_ROLE,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.ADMIN.CREATE_ROLE),
  createRolesController as RequestHandler,
);
router.patch(
  "/:id",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.ADMIN.UPDATE_ROLE,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.ADMIN.UPDATE_ROLE),
  updateSingleRoleController as RequestHandler,
);
router.delete(
  "/:id",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.ADMIN.DELETE_ROLE,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.ADMIN.DELETE_ROLE),
  deleteSingleRoleController as RequestHandler,
);
export default router;
