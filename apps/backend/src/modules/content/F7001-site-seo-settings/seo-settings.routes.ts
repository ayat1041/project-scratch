import { RequestHandler, Router } from "express";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { hasPermission } from "@/middleware/permission.middleware";
import { csrfProtection } from "@/middleware/csrf.middleware";
import { rateLimitingOnIndividualUserAndIp } from "@/middleware/rate-limit.middleware";
import { RATELIMITING_VALUES } from "@/constants/rate-limiting-values";
import { ROUTE_ACCESS_TYPE } from "@/constants/variables";
import { PERMISSIONS } from "@repo/constants";
import {
  getDraftSiteSeoSettingsController,
  getPublishedSiteSeoSettingsController,
  listSiteSeoSettingsVersionsController,
  publishSiteSeoSettingsController,
  restoreSiteSeoSettingsVersionController,
  saveDraftSiteSeoSettingsController,
} from "@/modules/content/F7001-site-seo-settings/controllers/seo-settings.controller";

const router = Router();

// Public — consumed by the frontend to render metadata/robots.txt/sitemap.xml
router.get(
  "/published",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.CONTENT.PUBLIC_READ),
  getPublishedSiteSeoSettingsController as RequestHandler,
);

router.get(
  "/draft",
  isAuthenticated(),
  hasPermission(
    PERMISSIONS.CONTENT.READ_SITE_SEO_SETTINGS,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  getDraftSiteSeoSettingsController as RequestHandler,
);

router.put(
  "/draft",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.CONTENT.UPDATE_SITE_SEO_SETTINGS,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.CONTENT.SAVE_DRAFT),
  saveDraftSiteSeoSettingsController as RequestHandler,
);

router.post(
  "/publish",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.CONTENT.PUBLISH_SITE_SEO_SETTINGS,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.CONTENT.PUBLISH),
  publishSiteSeoSettingsController as RequestHandler,
);

router.get(
  "/versions",
  isAuthenticated(),
  hasPermission(
    PERMISSIONS.CONTENT.READ_SITE_SEO_SETTINGS,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  listSiteSeoSettingsVersionsController as RequestHandler,
);

router.post(
  "/versions/:id/restore",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(
    PERMISSIONS.CONTENT.UPDATE_SITE_SEO_SETTINGS,
    undefined,
    ROUTE_ACCESS_TYPE.ADMIN,
  ) as RequestHandler,
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.CONTENT.RESTORE_VERSION),
  restoreSiteSeoSettingsVersionController as RequestHandler,
);

export default router;
