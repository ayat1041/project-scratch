import { RequestHandler, Router } from "express";

import { rateLimitingOnIndividualUserAndIp } from "@/middleware/rate-limit.middleware";
import { RATELIMITING_VALUES } from "@/constants/rate-limiting-values";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { csrfProtection, ensureCsrfToken } from "@/middleware/csrf.middleware";

import { signinController } from "./controllers/sign-in.controller";
import { signoutController } from "./controllers/sign-out.controller";
import { sessionInfoController } from "./controllers/session-info.controller";
import { googleSignIn } from "./controllers/google-signin-controller";
import { linkedinSignIn } from "./controllers/linkedin-signin-controller";

/*
 * F1002 — Sign In & Session
 *
 * Every route here establishes, reads, or tears down an authenticated session:
 * password sign-in, the two OAuth entry points, sign-out, and session-info.
 */
const signinRoutes = Router();

signinRoutes.post(
  "/sign-in",
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.SIGNIN),
  signinController as RequestHandler,
);

signinRoutes.post(
  "/sign-out",
  isAuthenticated(),
  csrfProtection(),
  rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.SIGNOUT),
  signoutController as RequestHandler,
);

signinRoutes.get(
  "/session-info",
  isAuthenticated(),
  ensureCsrfToken(),
  sessionInfoController as RequestHandler,
);

signinRoutes.get("/google", googleSignIn as RequestHandler);

signinRoutes.get("/linkedin", linkedinSignIn as RequestHandler);

export default signinRoutes;
