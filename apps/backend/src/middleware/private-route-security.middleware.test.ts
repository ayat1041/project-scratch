import assert from "node:assert/strict";
import test, { after } from "node:test";

import type { ExistenceCheckFn } from "@/middleware/resolve-resource.middleware";
import type { PolicyModule } from "@/policies/base.policy";

process.env.CSRF_SECRET ??= "test-csrf-secret-for-private-route-security";

const recordsExist: ExistenceCheckFn = async (resourceIds) => ({
  success: true,
  missingIds: [],
  resources: resourceIds.map((resourceId) => ({
    resourceId,
    organizationId: "00000000-0000-0000-0000-000000000001",
  })),
});

const allowPolicy = {
  canAccess: async () => ({ authorized: true }),
} satisfies PolicyModule;

async function loadRouteSecurity() {
  return import("./private-route-security.middleware");
}

after(async () => {
  const redisClient = (await import("@/infrastructure/cache/redis-client"))
    .default;
  const { closeDbPool } = await import("@/db/db");
  await redisClient.disconnect();
  await closeDbPool();
});

test("privateReadRoute builds auth-only chain for private read routes without extra gates", async () => {
  const { getPrivateRouteSecuritySteps, privateReadRoute } =
    await loadRouteSecurity();

  assert.deepEqual(getPrivateRouteSecuritySteps(privateReadRoute()), ["auth"]);
});

test("privateMutationRoute builds auth and csrf chain for private mutations without extra gates", async () => {
  const { getPrivateRouteSecuritySteps, privateMutationRoute } =
    await loadRouteSecurity();

  assert.deepEqual(getPrivateRouteSecuritySteps(privateMutationRoute()), [
    "auth",
    "csrf",
  ]);
});

test("privateReadRoute orders permission, resource resolution, and authorization after auth", async () => {
  const { getPrivateRouteSecuritySteps, privateReadRoute } =
    await loadRouteSecurity();

  const handlers = privateReadRoute({
    permission: "records:read",
    resource: { exists: recordsExist, fieldName: "recordId" },
    authorization: { policy: allowPolicy, action: "canAccess" },
  });

  assert.deepEqual(getPrivateRouteSecuritySteps(handlers), [
    "auth",
    "permission",
    "resource",
    "authorization",
  ]);
});

test("privateMutationRoute orders csrf before permission, resource resolution, and authorization", async () => {
  const { getPrivateRouteSecuritySteps, privateMutationRoute } =
    await loadRouteSecurity();

  const handlers = privateMutationRoute({
    permission: "records:update",
    resource: {
      exists: recordsExist,
      fieldName: "recordIds",
      source: "body",
    },
    authorization: { policy: allowPolicy, action: "canAccess" },
  });

  assert.deepEqual(getPrivateRouteSecuritySteps(handlers), [
    "auth",
    "csrf",
    "permission",
    "resource",
    "authorization",
  ]);
});

test("private route authorization requires resource resolution first", async () => {
  const { privateMutationRoute } = await loadRouteSecurity();

  assert.throws(
    () =>
      privateMutationRoute({
        authorization: { policy: allowPolicy, action: "canAccess" },
      }),
    /authorization requires resource resolution first/,
  );
});
