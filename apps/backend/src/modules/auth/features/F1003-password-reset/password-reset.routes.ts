import { RequestHandler, Router } from "express";

import { rateLimitingOnIndividualUserAndIp } from "@/middleware/rate-limit.middleware";
import { RATELIMITING_VALUES } from "@/constants/rate-limiting-values";

import { forgotPasswordRequestController } from "./controllers/forgot-password.controller";
import { validateResetPasswordLinkController } from "./controllers/validate-reset-password-link.controller";
import { resetPasswordController } from "./controllers/reset-password.controller";

/*
 * F1003 — Password Reset
 *
 * request link → validate link → set new password
 */
const passwordResetRoutes = Router();

passwordResetRoutes.post(
  "/forgot-password",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.FORGOT_PASSWORD),
  forgotPasswordRequestController as RequestHandler,
);

passwordResetRoutes.post(
  "/validate-reset-password-link",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.FORGOT_PASSWORD),
  validateResetPasswordLinkController as RequestHandler,
);

passwordResetRoutes.post(
  "/reset-password",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.FORGOT_PASSWORD),
  resetPasswordController as RequestHandler,
);

export default passwordResetRoutes;
