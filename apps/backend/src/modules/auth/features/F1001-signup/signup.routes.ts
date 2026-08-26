import { RequestHandler, Router } from "express";

import { rateLimitingOnIndividualUserAndIp } from "@/middleware/rate-limit.middleware";
import { RATELIMITING_VALUES } from "@/constants/rate-limiting-values";

import { checkEmailUniquenessController } from "./controllers/check-email-uniqueness.controller";
import { signupController } from "./controllers/sign-up.controller";
import { resendEmailVerificationController } from "./controllers/resend-email-verification.controller";
import { emailVerificationController } from "./controllers/email-verification.controller";

/*
 * F1001 — Signup & Email Verification
 *
 * REGISTRATION FLOW (Token-Based):
 * 1. POST /sign-up                          → creates user, sends verification email with link
 * 2. POST /verify-email                     → verifies email, returns auth tokens
 * 3. POST /resend-email-verification-link   → resends verification link (optional)
 */
const signupRoutes = Router();

signupRoutes.post(
  "/check-email-uniqueness",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.SIGNUP),
  checkEmailUniquenessController as RequestHandler,
);

signupRoutes.post(
  "/sign-up",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.SIGNUP),
  signupController as RequestHandler,
);

signupRoutes.post(
  "/resend-email-verification-link",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.SIGNUP),
  resendEmailVerificationController as RequestHandler,
);

signupRoutes.post(
  "/verify-email",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.SIGNUP),
  emailVerificationController as RequestHandler,
);

export default signupRoutes;
