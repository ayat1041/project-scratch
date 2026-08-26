import type { RequestHandler } from "express";

import { ROUTE_ACCESS_TYPE } from "@/constants/variables";
import { authorize } from "@/middleware/authorize.middleware";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { csrfProtection } from "@/middleware/csrf.middleware";
import { resolveResources } from "@/middleware/resolve-resource.middleware";
import type { ExistenceCheckFn } from "@/middleware/resolve-resource.middleware";
import { hasPermission } from "@/middleware/permission.middleware";
import type { PolicyModule } from "@/policies/base.policy";

type RouteAccessType =
  (typeof ROUTE_ACCESS_TYPE)[keyof typeof ROUTE_ACCESS_TYPE];

export type PrivateRouteSecurityStep =
  | "auth"
  | "csrf"
  | "permission"
  | "resource"
  | "authorization";

export const PRIVATE_ROUTE_SECURITY_STEP: unique symbol = Symbol(
  "privateRouteSecurityStep",
);

type AuditedRequestHandler = RequestHandler & {
  [PRIVATE_ROUTE_SECURITY_STEP]?: PrivateRouteSecurityStep;
};

interface PrivateRouteResourceOptions<TResource = unknown> {
  exists: ExistenceCheckFn<TResource>;
  fieldName: string;
  source?: "params" | "body";
}

interface PrivateRouteAuthorizationOptions<TPolicy extends PolicyModule> {
  policy: TPolicy;
  action: keyof TPolicy & string;
}

interface PrivateRouteSecurityOptions<
  TPolicy extends PolicyModule = PolicyModule,
  TResource = unknown,
> {
  permission?: string;
  advancedPermission?: string;
  routeAccessType?: RouteAccessType;
  resource?: PrivateRouteResourceOptions<TResource>;
  authorization?: PrivateRouteAuthorizationOptions<TPolicy>;
}

function markRouteSecurityStep(
  handler: RequestHandler,
  step: PrivateRouteSecurityStep,
): RequestHandler {
  Object.defineProperty(handler, PRIVATE_ROUTE_SECURITY_STEP, {
    value: step,
    enumerable: false,
  });

  return handler;
}

export function getPrivateRouteSecurityStep(
  handler: RequestHandler,
): PrivateRouteSecurityStep | undefined {
  return (handler as AuditedRequestHandler)[PRIVATE_ROUTE_SECURITY_STEP];
}

export function getPrivateRouteSecuritySteps(
  handlers: RequestHandler[],
): PrivateRouteSecurityStep[] {
  return handlers
    .map(getPrivateRouteSecurityStep)
    .filter((step): step is PrivateRouteSecurityStep => step !== undefined);
}

function buildPrivateRouteSecurity<
  TPolicy extends PolicyModule,
  TResource = unknown,
>(
  options: PrivateRouteSecurityOptions<TPolicy, TResource> = {},
  { requireCsrf }: { requireCsrf: boolean },
): RequestHandler[] {
  const handlers: RequestHandler[] = [
    markRouteSecurityStep(isAuthenticated(), "auth"),
  ];

  if (requireCsrf) {
    handlers.push(markRouteSecurityStep(csrfProtection(), "csrf"));
  }

  if (options.permission) {
    handlers.push(
      markRouteSecurityStep(
        hasPermission(
          options.permission,
          options.advancedPermission,
          options.routeAccessType,
        ),
        "permission",
      ),
    );
  }

  if (options.resource) {
    handlers.push(
      markRouteSecurityStep(
        resolveResources(options.resource.exists, options.resource.fieldName, {
          source: options.resource.source,
        }),
        "resource",
      ),
    );
  }

  if (options.authorization) {
    if (!options.resource) {
      throw new Error(
        "private route authorization requires resource resolution first",
      );
    }

    handlers.push(
      markRouteSecurityStep(
        authorize(options.authorization.policy, options.authorization.action),
        "authorization",
      ),
    );
  }

  return handlers;
}

export function privateReadRoute<
  TPolicy extends PolicyModule = PolicyModule,
  TResource = unknown,
>(
  options: PrivateRouteSecurityOptions<TPolicy, TResource> = {},
): RequestHandler[] {
  return buildPrivateRouteSecurity(options, { requireCsrf: false });
}

export function privateMutationRoute<
  TPolicy extends PolicyModule = PolicyModule,
  TResource = unknown,
>(
  options: PrivateRouteSecurityOptions<TPolicy, TResource> = {},
): RequestHandler[] {
  return buildPrivateRouteSecurity(options, { requireCsrf: true });
}

// examples :
// authRoutesV1.post(
//   "/sign-out",
//   ...privateMutationRoute(),
//   rateLimitingOnIndividualUserAndIp(RATELIMITING_VALUES.AUTH.SIGNOUT),
//   signoutController as RequestHandler,
// );

// router.get(
//   "/",
//   ...privateReadRoute({
//     permission: PERMISSIONS.ADMIN.READ_USER,
//     routeAccessType: ROUTE_ACCESS_TYPE.ADMIN,
//   }),
//   getAllUsersController as RequestHandler,
// );

// router.patch(
//   "/:recordId",
//   ...privateMutationRoute({
//     permission: PERMISSIONS.ADMIN.UPDATE_USER,
//     routeAccessType: ROUTE_ACCESS_TYPE.ADMIN,
//     resource: {
//       exists: myResourceExists,
//       fieldName: "recordId",
//     },
//   }),
//   updateUserController as RequestHandler,
// );
