import { Request, Response, NextFunction } from "express";
import { createError } from "@/middleware/error.middleware";
import { ERROR_MESSAGES } from "@/constants/messages";
import {
  PolicyContext,
  AuthorizationResult,
  PolicyModule,
  PolicyFn,
} from "@/policies/base.policy";

/**
 * Options for the authorize middleware
 */
interface AuthorizeOptions {
  /**
   * If true, allow unauthenticated access and set hasPublicAccess flag
   * @default false
   */
  allowPublic?: boolean;

  /**
   * Custom error message when authorization fails
   */
  errorMessage?: string;
}

interface AuthorizationResourceData {
  resourceId: string;
  userId?: string | null;
  organizationId?: string | null;
  data?: unknown;
}

/**
 * Bulk Authorization Middleware
 *
 * Executes a policy function for each resource in a bulk operation.
 * Requires resolveResources middleware to be called first to populate res.locals.resourceData.
 *
 * Flow:
 * 1. Get bulk resource data from res.locals.resourceData
 * 2. For each resource, build policy context and execute policy function
 * 3. If any authorization fails, throw FORBIDDEN error
 * 4. If all authorized, continue to controller
 *
 * @param policy - The policy module containing authorization functions
 * @param action - The action function name to execute (e.g., 'canAccessOwnResource')
 * @param options - Additional options for authorization behavior
 *
 * @example
 * router.delete(
 *   '/:recordId',
 *   isAuthenticated(),
 *   hasPermission(PERMISSIONS.USER.DELETE_OWN_PROFILE, ""),
 *   resolveResources(myResourceExists, 'recordId'),
 *   authorize(basePolicy, 'canAccessOwnResource'),
 *   deleteController
 * );
 */
export const authorize = <T extends PolicyModule>(
  policy: T,
  action: keyof T & string,
  options: AuthorizeOptions = {},
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { allowPublic = false, errorMessage } = options;
    // Get bulk resource data from previous middleware
    const bulkResourceData = res.locals
      .resourceData as AuthorizationResourceData[];

    // Get the policy function
    const policyFn = policy[action] as PolicyFn;

    if (typeof policyFn !== "function") {
      throw createError.internal(ERROR_MESSAGES.SOMETHING_WENT_WRONG, {
        error: `Policy action '${action}' is not defined`,
      });
    }

    const hasPublicAccess = res.locals.hasPublicAccess || allowPublic;
    const hasAdminPermission = res.locals.hasAdminPermission || false;

    // Check authorization for each resource
    for (const resourceData of bulkResourceData) {
      // Build policy context for this specific resource
      const context: PolicyContext = {
        userId: res.locals.userId || "",
        hasAdminPermission,
        hasBasicPermission: res.locals.hasBasicPermission || false,
        hasAdvancedPermission: res.locals.hasAdvancedPermission || false,
        hasPublicAccess,
        resourceOwnerId: resourceData.userId || undefined,
        resourceOwnerOrganizationId: resourceData.organizationId || undefined,
        existingData: resourceData.data || undefined,
      };

      // Execute the policy check
      const result: AuthorizationResult = await policyFn(
        context,
        // resourceData.resourceId,
      );

      // SET EDIT ACCESS BASED ON THE POLICY'S OWN DECISION
      if (result.authorized) {
        res.locals.hasEditAccess = result?.metadata?.hasEditAccess || false;
      }

      if (!result.authorized) {
        throw createError.forbidden(
          errorMessage || ERROR_MESSAGES.PERMISSION_DENIED,
          {
            error: result.reason || ERROR_MESSAGES.PERMISSION_DENIED,
            action: action,
            resourceId: resourceData.resourceId,
          },
        );
      }
    }

    // All resources authorized - attach metadata to res.locals
    res.locals.authorization = {
      action,
      bulkAuthorized: true,
      resourceCount: bulkResourceData.length,
    };

    return next();
  };
};

/**
 * Shorthand for authorize with public access enabled
 */
export const authorizePublic = <T extends PolicyModule>(
  policy: T,
  action: keyof T & string,
) => {
  return authorize(policy, action, { allowPublic: true });
};
