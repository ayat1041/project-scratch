import { RequestHandler, Router } from "express";
import { createLanguageController } from "@/modules/common/F5004-languages/controllers/create-language.controller";
import { getLanguagesController } from "@/modules/common/F5004-languages/controllers/get-language.controller";
import { deleteLanguageController } from "@/modules/common/F5004-languages/controllers/delete-language.controller";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { hasPermission } from "@/middleware/permission.middleware";
import { csrfProtection } from "@/middleware/csrf.middleware";
import { PERMISSIONS } from "@repo/constants";

const router = Router();

router.get(
  "/",
  isAuthenticated(),
  hasPermission(PERMISSIONS.COMMON.READ_LANGUAGE) as RequestHandler,
  getLanguagesController as RequestHandler,
);
router.post(
  "/",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.COMMON.CREATE_LANGUAGE) as RequestHandler,
  createLanguageController as RequestHandler,
);
router.delete(
  "/:id",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.COMMON.DELETE_LANGUAGE) as RequestHandler,
  deleteLanguageController as RequestHandler,
);

export default router;
