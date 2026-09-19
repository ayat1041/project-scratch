import { RequestHandler, Router } from "express";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { hasPermission } from "@/middleware/permission.middleware";
import { csrfProtection } from "@/middleware/csrf.middleware";
import { rateLimitingOnIndividualUserAndIp } from "@/middleware/rate-limit.middleware";
import { RATELIMITING_VALUES } from "@/constants/rate-limiting-values";
import { ROUTE_ACCESS_TYPE } from "@/constants/variables";
import { PERMISSIONS } from "@repo/constants";
import {
  createSeoPageController,
  deleteSeoPageController,
  getPublicSeoPageOverrideController,
  getSeoPageController,
  listSeoPageVersionsController,
  listSeoPagesController,
  publishSeoPageController,
  saveSeoPageDraftController,
} from "@/modules/content/F7002-seo-pages/controllers/seo-pages.controller";

const router = Router();

// Public — consumed by the frontend to look up a per-page override by path
router.get(
  "/public",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.CONTENT.PUBLIC_READ),
  getPublicSeoPageOverrideController as RequestHandler,
);

router.get(
  "/",
  isAuthenticated(),
  hasPermission(PERMISSIONS.CONTENT.READ_SEO_PAGE, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  listSeoPagesController as RequestHandler,
);

router.get(
  "/:id",
  isAuthenticated(),
  hasPermission(PERMISSIONS.CONTENT.READ_SEO_PAGE, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  getSeoPageController as RequestHandler,
);

router.post(
  "/",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.CONTENT.CREATE_SEO_PAGE, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.CONTENT.CREATE_PAGE),
  createSeoPageController as RequestHandler,
);

router.put(
  "/:id/draft",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.CONTENT.UPDATE_SEO_PAGE, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.CONTENT.SAVE_DRAFT),
  saveSeoPageDraftController as RequestHandler,
);

router.post(
  "/:id/publish",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.CONTENT.PUBLISH_SEO_PAGE, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.CONTENT.PUBLISH),
  publishSeoPageController as RequestHandler,
);

router.delete(
  "/:id",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.CONTENT.DELETE_SEO_PAGE, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.CONTENT.DELETE_PAGE),
  deleteSeoPageController as RequestHandler,
);

router.get(
  "/:id/versions",
  isAuthenticated(),
  hasPermission(PERMISSIONS.CONTENT.READ_SEO_PAGE, undefined, ROUTE_ACCESS_TYPE.ADMIN) as RequestHandler,
  listSeoPageVersionsController as RequestHandler,
);

export default router;
