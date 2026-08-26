---
name: backend-auth-and-policies
description: Layer B2 — authentication, permissions, resource resolution, and authorization policies in apps/backend. Use when adding a permission gate, writing an existence check for resolveResources, authoring a policy function, or reading res.locals. Covers PolicyContext, BulkResourceData, and the res.locals contract.
---

# B2 — Auth Chain and Policies

Four middlewares run before every protected controller, in this order. Each one populates `res.locals` for the next.

```
isAuthenticated()   → res.locals.userId, clientIp, clientUserAgent
hasPermission()     → res.locals.hasAdminPermission / hasBasicPermission / hasAdvancedPermission
resolveResources()  → res.locals.resourceData: BulkResourceData<T>[]
authorize()         → res.locals.authorization: { action, bulkAuthorized, resourceCount }
```

## `res.locals` contract

| Key | Set by | Type | Contents |
|---|---|---|---|
| `userId` | `isAuthenticated` | `string` | Authenticated user's id |
| `hasAdminPermission` | `hasPermission` | `boolean` | |
| `hasBasicPermission` | `hasPermission` | `boolean` | |
| `hasAdvancedPermission` | `hasPermission` | `boolean` | |
| `resourceData` | `resolveResources` | `BulkResourceData<T>[]` | Resolved records — **always an array**, even for a single-param route |
| `authorization` | `authorize` | `{ action, bulkAuthorized, resourceCount }` | Set once every resource passes the policy |
| `clientIp` / `clientUserAgent` | auth middleware | `string` | Activity logging |

Controllers read from here. Services never do — the controller passes what the service needs as arguments.

## Existence check functions (fuel for `resolveResources`)

Location: `src/domain/<domain>/<subdomain>/models/<resource>-queries.model.ts`.

```typescript
import { ExistenceCheckResult } from "@/middleware/resolve-resource.middleware";

export const myResourceExists = async (
  ids: string[],
): Promise<ExistenceCheckResult<MyDataType>> => {
  const records = await db.select({ /* only what the controller + policy need */ })
    .from(myTable)
    .where(inArray(myTable.id, ids));

  return {
    resources: records.map((record) => ({
      resourceId: record.id,
      userId: record.userId ?? null,
      organizationId: record.organizationId,   // drives authorize + controller
      data: record,
    })),
  };
};
```

Rules:

- Select **exactly** the fields the controller and the policy need — no `select *`, no extras "just in case". This query runs on every request to the route.
- Always set `organizationId` when the resource is org-scoped; the policy and controller both read it, and omitting it forces a redundant lookup downstream.
- Set `userId` when the resource has an owning user; `null` otherwise.
- Put everything the controller will filter on into `data` — that is what lets the controller filter in memory instead of issuing a second query.

## Policy functions

Location: `src/policies/<domain>.policy.ts`. Currently only `base.policy.ts` exists; domain-specific policies (e.g. `user-management.policy.ts`, `common.policy.ts`) are added here as a feature needs resource-level checks.

```typescript
import { allow, deny, AuthorizationResult, PolicyContext } from "@/policies/base.policy";

export const isOwnerOrAdmin = async (
  context: PolicyContext,
  resourceId: string,        // = BulkResourceData.resourceId
): Promise<AuthorizationResult> => {
  if (context.resourceOwnerId !== context.userId) {
    return deny(ERROR_MESSAGES.PERMISSION_DENIED);
  }
  return allow();
};

export const myPolicy = { isOwnerOrAdmin };
```

`PolicyContext` is populated automatically by `authorize`:

| Field | Source |
|---|---|
| `context.userId` | `res.locals.userId` |
| `context.resourceOwnerId` | `BulkResourceData.userId` |
| `context.organizationId` | `BulkResourceData.organizationId` |
| `context.hasAdminPermission` | `res.locals.hasAdminPermission` |
| `context.hasBasicPermission` | `res.locals.hasBasicPermission` |

Rules:

- A policy uses **only** `PolicyContext` fields. **No DB access inside a policy** — if it needs a field, the existence function must supply it.
- Return `allow()` / `deny(message)`, never a bare boolean or a thrown error.
- Policies are exported as a named object (`export const rolePolicy = { ... }`) so `authorize(policy, "actionName")` can look the action up by string.
- The action name passed to `authorize` must exist on the policy object — a typo fails at runtime, not at build.
- Policies are pure predicates. They never mutate, log, or queue.

## Permissions

`PERMISSIONS` comes from `@repo/constants`. `hasPermission(basic, advanced)` takes two slots; pass `""` for the one you do not use:

```typescript
hasPermission(PERMISSIONS.USER.UPDATE_OWN_PROFILE, "")
hasPermission(PERMISSIONS.USER.UPDATE_OWN_PROFILE, PERMISSIONS.ADMIN.UPDATE_USER)
```

Adding a new permission is a shared-package change: add it to `@repo/constants`, rebuild the package, and check the admin roles/permissions UI before assuming it is grantable.

## The separation that matters

| Concern | Belongs to |
|---|---|
| Is the caller logged in? | `isAuthenticated` |
| Does this role hold the permission at all? | `hasPermission` |
| Do these records exist, and who owns them? | existence function via `resolveResources` |
| May *this* caller act on *these* records? | policy via `authorize` |
| Which of the resolved records are eligible by status? | **controller**, in memory |
| Perform the change | service |

Status/eligibility filtering is a controller job, not a policy job — the policy answers "may you", not "does the state allow it".

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| DB query inside a policy | Have the existence function select the field |
| Permission string literal in a route | `PERMISSIONS.*` from `@repo/constants` |
| Existence function returning `select *` | Select only what the controller and policy read |
| `organizationId` omitted from resolved data, then re-queried in the service | Set it in the existence function |
| Ownership re-checked in the service | It already passed `authorize` |
| Middleware order changed for "convenience" | The order is the contract |
| Service reading `res.locals` | Controller passes values as arguments |

## Checklist

- [ ] Existence function lives in `domain/<domain>/<sub>/models/<resource>-queries.model.ts`
- [ ] It selects only needed fields and sets `resourceId`, `userId`, `organizationId`, `data`
- [ ] Policy reads only `PolicyContext` — no DB
- [ ] Policy exported on a named object; the `authorize` action string matches a real key
- [ ] Permissions referenced from `@repo/constants`
- [ ] Controller does status/eligibility filtering, not the policy
- [ ] `pnpm --filter backend build` passes
