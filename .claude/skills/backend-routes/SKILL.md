---
name: backend-routes
description: Layer B1 — Express route files in apps/backend. Use when adding a route, composing a middleware chain, mounting a feature router, or choosing between param-based and body-based bulk routes. Covers middleware order, resolveResources sources, and the redundant-param rule.
---

# B1 — Routes

A route file composes the middleware chain and binds a controller. **Nothing else** — no logic, no DB access, no inline handlers.

Location: `src/modules/<domain>/features/F<ID>-<name>/<feature-name>.routes.ts` (singleton at feature root; move to `routes/` only when there are several).

## Middleware order — never reorder

```
isAuthenticated() → hasPermission() → resolveResources() → authorize() → controller
```

Add `csrfProtection()` after `isAuthenticated()` for state-changing routes that need it (see `roles.routes.ts` for the precedent).

## Single resource from params

```typescript
router.patch(
  "/:recordId",
  isAuthenticated(),
  hasPermission(PERMISSIONS.USER.UPDATE_OWN_PROFILE, ""),
  resolveResources(myResourceExists, "recordId"),   // source defaults to "params"
  authorize(myPolicy, "policyActionName"),
  myController as RequestHandler,
);
```

## Bulk resources from body

Flat path, no `:id` param, `{ source: "body" }`:

```typescript
router.delete(
  "/remove",
  isAuthenticated(),
  hasPermission(PERMISSIONS.ADMIN.DELETE_ROLE, ""),
  resolveResources(myResourceExists, "ids", { source: "body" }),
  authorize(myPolicy, "policyActionName"),
  myController as RequestHandler,
);
// Body: { "ids": ["uuid1", "uuid2"] }
```

## The redundant-param rule

When a resource stores `organizationId` as a column, **do not put `organizationId` in the URL**. Resolve the resource's own id and read the owner from the resolved data.

```typescript
// ✓ apiKeyId only — organizationId comes from the resolved api key
router.post(
  "/api-keys/:apiKeyId/rotate",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.USER.UPDATE_OWN_PROFILE, PERMISSIONS.ADMIN.UPDATE_USER),
  resolveResources(apiKeysExist, "apiKeyId"),
  authorize(userManagementPolicy, "isOwnerOrAdminWithAdvancedPermission"),
  rotateApiKeyController as RequestHandler,
);

// ✗ redundant param — forces an extra org-match check in the service
router.post("/:organizationId/api-keys/:apiKeyId/rotate", ...);
```

The existence function must then populate `organizationId` on every resolved entry, because that is what `authorize` and the controller read:

```typescript
resources: records.map((record) => ({
  resourceId: record.id,
  userId: null,
  organizationId: record.organizationId,
  data: record,
})),
```

## Mounting

Feature routers are mounted by the domain router at `src/modules/<domain>/<domain>.routes.ts`:

```typescript
import apiKeysRoutes from "./features/F6003-api-keys/api-keys.routes";

router.use("/api-keys", apiKeysRoutes);
router.use("/roles", roleManagementRoutes);
```

Mount order matters when paths can collide. Routers whose paths would be captured by a `:param` segment (countries, states, cities) are mounted at `/` **before** the parameterised ones — follow the existing comments in `auth.routes.ts` rather than appending blindly to the end.

## Rules

- One `Router()` per file, default-exported.
- Controllers are imported and bound, never defined inline. `as RequestHandler` is the existing cast convention.
- Permissions come from `PERMISSIONS` in `@repo/constants` — never a string literal.
- `hasPermission(basic, advanced)` takes two permission slots; pass `""` for the unused one.
- Express 5 wildcards are `{*}`, not `*`.
- A route that needs no resource resolution still needs `isAuthenticated` + `hasPermission`; skip `resolveResources`/`authorize` only when there is genuinely no resource to authorize against, and say so in a comment.
- GET list endpoints follow `backend-list-endpoints` for query-param handling.

## Checklist

- [ ] File is `<feature-name>.routes.ts` at the feature root
- [ ] Middleware order is exactly `isAuthenticated → hasPermission → resolveResources → authorize → controller`
- [ ] Bulk body routes use a flat path and `{ source: "body" }`
- [ ] No redundant owner id in the URL when the resource carries it
- [ ] Permissions referenced from `PERMISSIONS`, not literals
- [ ] Router mounted in the domain router, in an order that does not collide with `:param` segments
- [ ] `pnpm --filter backend build` passes
