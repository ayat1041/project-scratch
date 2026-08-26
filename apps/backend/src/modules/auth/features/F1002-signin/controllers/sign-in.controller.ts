import { validateZodSchema } from "@/middleware/validation.middleware";
import { Request, Response } from "express";

import { createError } from "@/middleware/error.middleware";
import { compare } from "bcryptjs";
import { IS_PRODUCTION } from "@/constants/variables";
import { createSession } from "@/lib/session-auth.utils";
import { asyncHandler } from "@/utils/async-handler";
import { validateSiteContextForUser } from "@/modules/auth/auth.utils";

import { getAllowedRoutes, ROUTES, PERMISSIONS } from "@repo/constants";
import type { AuthSessionData } from "@repo/schemas-types/payload-schemas/auth/Response.type";
import type { SigninResponse } from "@repo/schemas-types/payload-schemas/auth/Response.type";
import { SigninPayloadValidationSchema } from "@repo/schemas-types/payload-schemas/auth/Payload.schema";
import { getUserByEmailWithRolesAndPermissions } from "@/domain/users/models/users/users.queries";

const DUMMY_PASSWORD_HASH =
  "$2a$12$N6DFn/fR44Dik.ybgR5MXOg5nM/Uy2HKarYKVrMIACOW9icv1XBhe";

const invalidSigninError = () =>
  createError.badRequest("Email or password is incorrect.");

export const signinController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = validateZodSchema(
      SigninPayloadValidationSchema,
    )(req.body);

    const userInfo = await getUserByEmailWithRolesAndPermissions(email);
    const passwordHash = userInfo?.isVerified
      ? userInfo.password
      : DUMMY_PASSWORD_HASH;
    const passwordMatch = await compare(password, passwordHash);

    if (!userInfo || !userInfo.isVerified || !passwordMatch) {
      throw invalidSigninError();
    }

    // Check if user is trying to sign in through the correct portal based on their role
    const siteContext = validateSiteContextForUser(
      req,
      userInfo.permissions,
      "signin",
    );

    const isUserAdmin = userInfo.permissions.includes(
      PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
    );

    // Compute allowed routes based on permissions and site context
    const allowedRoutes = isUserAdmin
      ? getAllowedRoutes(ROUTES.ADMIN, userInfo.permissions)
      : getAllowedRoutes(ROUTES.USER, userInfo.permissions);

    // Build the session data in one step
    const sessionData: AuthSessionData = {
      userInfo: {
        id: userInfo.id,
        email: userInfo.email,
        userName: userInfo.userName,
        profileImage: userInfo.profileImage,
        registeredAt: userInfo.registeredAt,
      },
      allowedRoutes,
      roles: userInfo.roles,
      permissions: userInfo.permissions,
    };

    // Create session using the single-token approach
    const sessionToken = await createSession(
      res,
      userInfo.id,
      userInfo.email,
      req,
    );

    const redirectUrl =
      siteContext === "main"
        ? ROUTES.USER.DASHBOARD.href
        : ROUTES.ADMIN.DASHBOARD.href;

    const baseResponse: SigninResponse = {
      success: true,
      message: "Signin successful",
      data: sessionData,
      // Only include token in response for non-production (debugging)
      token: IS_PRODUCTION ? undefined : sessionToken,
      _links: {
        redirectUrl: redirectUrl,
      },
    };

    res.status(200).json(baseResponse);
  },
);
