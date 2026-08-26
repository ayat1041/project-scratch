import { Router } from "express";

import signupRoutes from "./features/F1001-signup/signup.routes";
import signinRoutes from "./features/F1002-signin/signin.routes";
import passwordResetRoutes from "./features/F1003-password-reset/password-reset.routes";

/*
 * Auth module router, mounted at /api/auth/v1.
 *
 * Each feature router is mounted at "/" so every URL stays exactly where it was before
 * the F1xxx split — the paths live in the feature routers, not here.
 */
const authRoutesV1 = Router();

authRoutesV1.use("/", signupRoutes);
authRoutesV1.use("/", signinRoutes);
authRoutesV1.use("/", passwordResetRoutes);

export default authRoutesV1;
