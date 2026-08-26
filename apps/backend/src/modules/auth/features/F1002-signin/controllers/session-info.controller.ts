import { Request, Response } from "express";
import {
  getUserIdFromAuth,
  validateSiteContextForUser,
} from "@/modules/auth/auth.utils";
import { asyncHandler } from "@/utils/async-handler";
import type { AuthSessionData } from "@repo/schemas-types/payload-schemas/auth/Response.type";
import type { SessionInfoResponse } from "@repo/schemas-types/payload-schemas/auth/Response.type";
import { getUserByIdWithRolesAndPermissions } from "@/domain/users/models/users/users.queries";
import { getAllowedRoutes, ROUTES, PERMISSIONS } from "@repo/constants";

export const sessionInfoController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromAuth(res);

    const userInfo = await getUserByIdWithRolesAndPermissions(userId);
    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        type: "NOT_FOUND",
      });
    }

    // Get complete user info with roles and permissions
    validateSiteContextForUser(req, userInfo.permissions);

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

    // Format the response
    const baseResponse: SessionInfoResponse = {
      success: true,
      message: "Session info retrieved successfully",
      data: sessionData,
    };

    res.status(200).json(baseResponse);
  },
);
