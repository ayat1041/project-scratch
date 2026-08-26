import { ERROR_MESSAGES } from "@/constants/messages";
import { PERMISSIONS } from "@repo/constants";
import { ROUTE_ACCESS_TYPE } from "@/constants/variables";
import { getPermissions } from "@/lib/auth.utils";
import { createError } from "@/middleware/error.middleware";
import { Request, Response, NextFunction } from "express";

type RouteAccessType =
  (typeof ROUTE_ACCESS_TYPE)[keyof typeof ROUTE_ACCESS_TYPE];

export const hasPermission = (
  basicPermission: string,
  advancedPermission?: string,
  routeAccessType: RouteAccessType = ROUTE_ACCESS_TYPE.NON_ADMIN, // 1. non-admin 2. admin
  // hasPublicAccess: boolean = false,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId;
    const hasPublicAccess = res.locals.hasPublicAccess;
    const allowsPublicAccess = res.locals.allowsPublicAccess || hasPublicAccess;
    const canUsePublicAccess =
      routeAccessType !== ROUTE_ACCESS_TYPE.ADMIN && allowsPublicAccess;
    res.locals.routeAccessType = routeAccessType;

    // Check user permissions
    const userPermissions = userId ? await getPermissions(userId) : [];
    const hasBasicPermission = userPermissions.includes(basicPermission);
    const hasAdvancedPermission = advancedPermission
      ? userPermissions.includes(advancedPermission)
      : false;
    const hasAdminPermission = userPermissions.includes(
      PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
    );
    // if route is admin type and user doesn't have admin permission then return forbidden
    if (routeAccessType === ROUTE_ACCESS_TYPE.ADMIN && !hasAdminPermission) {
      throw createError.forbidden(ERROR_MESSAGES.PERMISSION_DENIED, {
        error: `User with ID ${userId} trying to access admin route without admin permissions`,
        hint: `User needs admin permissions to access this resource.`,
      });
    }

    // if user has admin permission but doesn't have basic or advanced permission then return forbidden
    if (
      hasAdminPermission &&
      !hasBasicPermission &&
      !hasAdvancedPermission &&
      !canUsePublicAccess
    ) {
      throw createError.forbidden(ERROR_MESSAGES.PERMISSION_DENIED, {
        error: `User with ID ${userId} has admin permissions but lacks required route permissions. Required: ${basicPermission}${advancedPermission ? ` or ${advancedPermission}` : ""}`,
        hint: `User needs at least ${basicPermission} permission to access this resource.`,
      });
    }

    if (
      !hasBasicPermission &&
      !hasAdvancedPermission &&
      !hasAdminPermission &&
      !canUsePublicAccess
    ) {
      throw createError.forbidden(ERROR_MESSAGES.PERMISSION_DENIED, {
        error: `User with ID ${userId} does not have required permissions to access this route. Required: ${basicPermission}${advancedPermission ? ` or ${advancedPermission}` : ""}`,
        hint: `User needs at least ${basicPermission} permission to access this resource.`,
      });
    }

    // Set permissions in res.locals for downstream use
    res.locals.hasAdminPermission = hasAdminPermission;
    res.locals.hasBasicPermission = hasBasicPermission;
    res.locals.hasAdvancedPermission = hasAdvancedPermission;
    return next();
  };
};
