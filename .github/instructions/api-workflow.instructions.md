---
description: "Use when creating new backend API endpoints, route handlers, middleware chains, policies, or domain query functions. Covers the full request lifecycle: resolveResources → authorize → controller → service pattern used in this codebase."
applyTo: "apps/backend/src/**/*.{routes.ts,controller.ts,service.ts,policy.ts,queries.model.ts}"
---

# Backend Endpoint Workflow

Related standards:

- For list-style GET endpoints, follow [GET List Service Construction Guide](./get-list-service.instructions.md).

## Request Lifecycle (Always Follow This Order)

```
Request
  → isAuthenticated()          # 1. Verify JWT, set res.locals.userId
  → hasPermission()            # 2. Check role-level permission gate
  → resolveResources()         # 3. Fetch + validate resource existence, set res.locals.resourceData
  → authorize()                # 4. Policy check per resource using res.locals.resourceData
  → Controller                 # 5. Read pre-resolved data, call service
  → Service                    # 6. Only perform mutations — no re-fetching already-resolved data
```

---

## 1. Route Definition

### Single resource from params (GET, PATCH, DELETE /:id)

```typescript
router.patch(
  "/:recordId",
  isAuthenticated(),
  hasPermission(PERMISSIONS.USER_MANAGEMENT.UPDATE_OWN_PROFILE, ""),
  resolveResources(myResourceExists, "recordId"), // source defaults to "params"
  authorize(myPolicy, "policyActionName"),
  myController as RequestHandler,
);
```

### Bulk resources from body (bulk DELETE, bulk PATCH)

```typescript
router.delete(
  "/remove", // no :id param needed
  isAuthenticated(),
  hasPermission(PERMISSIONS.USER_MANAGEMENT.UPDATE_ROLE, ""),
  resolveResources(myResourceExists, "ids", { source: "body" }),
  authorize(myPolicy, "policyActionName"),
  myController as RequestHandler,
);
// Body: { "ids": ["uuid1", "uuid2"] }
```

### Resource identified implicitly (e.g., role scoped via existing record)

When a resource (e.g. a session, document, message) stores `roleId` as a column,
**do not add `roleId` as a URL param**. Resolve only the resource's own ID and
read `roleId` from the resolved data.

**Rule:** If the existence function sets `roleId` on `BulkResourceData`, the route
needs only one param (the resource ID). The controller reads `roleId` from
`res.locals.resourceData[0].roleId`; the policy uses it for the role ownership check.

```typescript
// ✓ Correct — sessionId only; roleId comes from the resolved session
router.post(
  "/sessions/:sessionId/notes",
  isAuthenticated(),
  csrfProtection(),
  hasPermission(PERMISSIONS.USER_MANAGEMENT.UPDATE_OWN_ROLE, PERMISSIONS.USER_MANAGEMENT.UPDATE_ROLES),
  resolveResources(roleSessionsExist, "sessionId"),
  authorize(rolePolicy, "isRoleOwnerOrMemberWithAdvancedPermission"),
  addSessionNoteController as RequestHandler,
);

// Controller reads roleId from resolved data — never from req.params
const roleId = (res.locals.resourceData as BulkResourceData[])[0]!.roleId as string;

// ✗ Wrong — redundant param; forces an extra role-match check in the service
router.post(
  "/:roleId/sessions/:sessionId/notes",
  ...
);
```

The existence function must populate `roleId` in each `BulkResourceData` entry:

```typescript
resources: records.map((record) => ({
  resourceId: record.id,
  userId: null,
  roleId: record.roleId, // ← drives authorize + controller
  data: record,
})),
```

When the authorization target (e.g., `roleId`) can be derived from checking the
resource records themselves, pass the IDs that are known from the body/params.
The existence function resolves the owning entity and sets `roleId` on each
resource entry so `authorize` can do its job.

### GET list/read endpoints

When building a GET list/read endpoint:

- use this document for the overall endpoint lifecycle and controller/service responsibilities
- use `get-list-service.instructions.md` for:
  - query-param validation
  - route-param + query-param merge behavior
  - shared filter/sort/select constant placement
  - paginated query construction
  - count/summary response patterns

If the request is a list-style GET endpoint, do not invent a one-off query/controller structure. Follow the GET list service guide alongside this workflow document.

---

## 2. Existence Check Function (Domain Query Layer)

Location: `apps/backend/src/domain/<domain>/<subdomain>/models/<resource>-queries.model.ts`

### Required signature

```typescript
import { ExistenceCheckResult } from "@/middleware/resolve-resource.middleware";

export const myResourceExists = async (
  ids: string[],
): Promise<ExistenceCheckResult<MyDataType>> => {
  const records = await db
    .select({
      id: myTable.id,
      userId: myTable.userId,
      roleId:
        myTable.roleId /* ...other fields the controller/policy needs */,
    })
    .from(myTable)
    .where(inArray(myTable.id, ids));

  const foundIds = new Set(records.map((r) => r.id));
  const missingIds = ids.filter((id) => !foundIds.has(id));

  if (missingIds.length > 0) {
    return { success: false, missingIds, resources: [] };
  }

  return {
    success: true,
    missingIds: [],
    resources: records.map((record) => ({
      resourceId: record.id, // used as the ID passed to the policy function
      userId: record.userId, // drives "isOwner" checks in policy
      roleId: record.roleId, // drives role-scoped checks in policy
      data: record, // full record — available in res.locals.resourceData[n].data
    })),
  };
};
```

**Key rules:**

- Always accept `string[]`, never a single `string`.
- Always return `ExistenceCheckResult<T>` — never throw directly.
- Select **only the fields that policies or controllers will actually use** to avoid over-fetching.
- Include extra fields (e.g., `status`, `deletedAt`) when the controller needs to filter/branch without an extra DB call.

---

## 3. Policy Function

Location: `apps/backend/src/policies/<domain>.policy.ts`

```typescript
import {
  allow,
  deny,
  AuthorizationResult,
  PolicyContext,
} from "@/policies/base.policy";

export const isOwnerOrAdmin = async (
  context: PolicyContext,
  resourceId: string, // = BulkResourceData.resourceId from res.locals.resourceData
): Promise<AuthorizationResult> => {
  if (context.resourceOwnerId !== context.userId) {
    return deny(ERROR_MESSAGES.PERMISSION_DENIED);
  }
  return allow();
};

export const myPolicy = { isOwnerOrAdmin };
```

**`PolicyContext` fields** (populated automatically by `authorize` middleware):
| Field | Source |
|---|---|
| `context.userId` | `res.locals.userId` (set by `isAuthenticated`) |
| `context.resourceOwnerId` | `BulkResourceData.userId` |
| `context.roleId` | `BulkResourceData.roleId` |
| `context.hasAdminPermission` | `res.locals.hasAdminPermission` (set by `hasPermission`) |
| `context.hasBasicPermission` | `res.locals.hasBasicPermission` |

---

## 4. Controller

**Read from `res.locals.resourceData` — never re-query what `resolveResources` already fetched.**

```typescript
import { BulkResourceData } from "@/middleware/resolve-resource.middleware";

type ResolvedMyResource = BulkResourceData<MyDataType>;

export const myController = asyncHandler(
  async (req: Request, res: Response) => {
    const resourceData = res.locals.resourceData as ResolvedMyResource[];

    // Single resource
    const record = resourceData[0].data!;
    const roleId = resourceData[0].roleId as string;

    // Bulk — use the pre-fetched data to filter in-memory when possible
    const eligibleIds = resourceData
      .filter((r) => r.data!.status === "active")
      .map((r) => r.data!.id);
    const skippedIds = resourceData
      .map((r) => r.data!.id)
      .filter((id) => !eligibleIds.includes(id));

    const result = await myService(eligibleIds, skippedIds);

    res.status(200).json({ success: true, data: result });
  },
);
```

**Rules:**

- Get `userId` from `getUserIdFromAuth(res)`, not `req.body`.
- Use `res.locals.resourceData` as the source of truth for already-fetched records.
- Perform in-memory filtering (status checks, soft-delete checks) here using `data` fields — avoid adding a second DB read in the service for data already available.
- Pass pre-computed inputs (e.g., filtered IDs) into the service rather than the raw request data.

---

## 5. Service

**Services only mutate — they do not re-fetch what the controller already resolved.**

```typescript
// Good: receives pre-filtered IDs decided by the controller
export const removeThingsService = async (
  eligibleIds: string[],
  skippedIds: string[],
) => {
  if (eligibleIds.length > 0) {
    await db.update(myTable)
      .set({ deletedAt: new Date() })
      .where(inArray(myTable.id, eligibleIds));
  }
  return { removedCount: eligibleIds.length, skippedIds };
};

// Bad: re-queries for existence/status that resolveResources already checked
export const removeThingsService = async (ids: string[], orgId: string) => {
  const existing = await db.select(...).where(...); // ← redundant round trip
  ...
};
```

- Services will contains domain functions queries/commands. Domain functions lives in the `domain/.../models/` files, and are imported into the service files. Services should not import from controllers or policies.
- Services should not import from other services to avoid circular dependencies. If two services need to share domain functions, those functions should be lifted into the `domain/.../models/` layer.
- Services should not import from policies or call policy functions directly. Any necessary authorization checks should be done in the controller using `res.locals.resourceData` and `context` passed to the policy function.
- Services should not read from `req.params` or `req.body` directly. Any necessary data from the request should be passed in as arguments by the controller after any necessary pre-processing (e.g., filtering, branching based on status).
- Services should not read from `res.locals` directly. Any necessary data set by middleware (e.g., `userId`, permission flags) should be passed in as arguments by the controller.
- Types/Validations/Constants that could be used in the frontend implementation of the same feature can be defined in a shared package (e.g., `packages/types`, `packages/validations`, `packages/constants`) and imported into the service layer to ensure consistency.
- ***

## 6. `res.locals` Reference

| Key                     | Set by             | Type                                        | Contents                                                      |
| ----------------------- | ------------------ | ------------------------------------------- | ------------------------------------------------------------- |
| `userId`                | `isAuthenticated`  | `string`                                    | Authenticated user's ID                                       |
| `hasAdminPermission`    | `hasPermission`    | `boolean`                                   |                                                               |
| `hasBasicPermission`    | `hasPermission`    | `boolean`                                   |                                                               |
| `hasAdvancedPermission` | `hasPermission`    | `boolean`                                   |                                                               |
| `resourceData`          | `resolveResources` | `BulkResourceData<T>[]`                     | Resolved records (always array, even for single-param routes) |
| `authorization`         | `authorize`        | `{ action, bulkAuthorized, resourceCount }` | Set after all resources pass policy                           |
| `clientIp`              | auth middleware    | `string`                                    | For activity logging                                          |
| `clientUserAgent`       | auth middleware    | `string`                                    | For activity logging                                          |

---

## 7. File & Folder Conventions

```
src/
  domain/
    <domain>/                          # e.g., user-management, common
      <domain>.types.ts                # shared table row + query result types for the domain
      <subdomain>/                     # e.g., itself, roles
        models/
          <resource>-queries.model.ts  # existence checks + read queries
          <resource>-commands.model.ts # write queries (if separated)
  modules/
    <domain>/
      features/
        <feature>/
          <feature>.routes.ts
          controllers/
            <action>-<resource>.controller.ts
          services/
            <action>-<resource>.service.ts
  policies/
    <domain>.policy.ts
```

## 8. Domain-Level Shared Types (`<domain>.types.ts`)

For domains with multiple subdomains, query models, or services that share the same table row and query result shapes, define all types once in a single `<domain>.types.ts` file at the domain root. Import from it everywhere instead of redeclaring types per model or service file.

### When to create a domain types file

- Two or more model files in the same domain would otherwise declare the same `$inferSelect` aliases.
- A service's dependency-injection interface references types from multiple subdomains.
- A query result type (join/select shape) would be duplicated across model files.

### What goes in `<domain>.types.ts`

1. **Table row types** — one alias per table, derived via `$inferSelect`:

```typescript
// apps/backend/src/domain/user-management/user-management.types.ts
import {
  appRolesTable,
  appPermissionsTable,
  // ...other tables
} from "@/db/schema";

export type RoleRow = typeof appRolesTable.$inferSelect;
export type PermissionRow = typeof appPermissionsTable.$inferSelect;
// one alias per table — never duplicate across files
```

2. **Query result types** — join/select shapes returned by domain query functions. Define them here rather than inline in model files so services can import them directly:

```typescript
export type RolePermissionResult = Pick<
  PermissionRow,
  "id" | "key" | "label" | "category"
> & { roleId: string };

export type RoleWithPermissionsItem = Pick<RoleRow, "id" | "name" | "description"> & {
  permissions: RolePermissionResult[];
  // ...computed/joined fields
};
```

### How model files use domain types

Model files import types from `<domain>.types.ts` and annotate return types explicitly — no local type declarations:

```typescript
// role-permissions-queries.model.ts
import type {
  RoleRow,
  RolePermissionResult,
  RoleWithPermissionsItem,
} from "@/domain/user-management/user-management.types";

export const getRole = async (
  roleId: string,
): Promise<RoleRow | null> => { ... };

export const getRolePermissions = async (
  roleId: string,
): Promise<RolePermissionResult[]> => { ... };
```

### How service dependency interfaces use domain types

When a service accepts injected dependencies (for testability), the interface should use domain types — never `any`:

```typescript
// get-role-details.service.ts
import type {
  RoleRow,
  RolePermissionResult,
} from "@/domain/user-management/user-management.types";

interface RoleDetailsDependencies {
  getRole: (id: string) => Promise<RoleRow | null>;
  getRolePermissions: (id: string) => Promise<RolePermissionResult[]>;
  // ...
}
```

### Real example in this repo

- `src/domain/user-management/user-management.types.ts` — table row types + query result types for the user-management domain.
- `src/modules/user-management/features/F6002-roles/services/get-role-details.service.ts` — imports from `user-management.types.ts`; zero local type declarations.
- `src/modules/user-management/features/F6002-roles/services/get-role-details.service.ts` — `RoleDetailsDependencies` interface fully typed using domain types.

### Test mocks for typed dependency interfaces

When test mocks return partial objects that don't satisfy the full `$inferSelect` shape (they only need the fields the service actually reads), use `as unknown as Type` assertions:

```typescript
import type { RoleRow, RolePermissionResult } from "@/domain/user-management/user-management.types";

getRole: async () => ({ id: "role-1", name: "Editor", ... }) as unknown as RoleRow,
getRolePermissions: async () => [{ id: "perm-1", key: "user-management.update" }] as unknown as RolePermissionResult[],
```

This keeps test doubles minimal while satisfying the typed interface.

---

## 9. Naming Conventions (Important)

Use consistent, role-based names so file intent is obvious.

- Domain read operations: `<resource>-queries.model.ts`
  - Examples: existence checks, list/detail fetch, read-only aggregates.
- Domain write operations: `<resource>-commands.model.ts`
  - Examples: insert/update/delete statements, transactional write helpers.
- Feature service operations: `<action>-<resource>.service.ts`
  - Examples: `create-email-verification-token.service.ts`, `remove-email-verification-token.service.ts`.
- Controllers: `<action>-<resource>.controller.ts`
- Policies: `<domain>.policy.ts` with action methods such as `canRemoveRolePermission`.

When splitting internal helpers inside a feature service folder:

- Use `*.persistence.ts` for mixed durability concerns:
  - DB writes/reads + audit/event-log writes + queue-failure persistence.
- Use `*.repository.ts` only for narrow entity data-access abstractions:
  - Mostly CRUD/query methods for a single aggregate/table set.
- Use `*.utils.ts` for pure/small helper functions without IO side effects.
- Use `*.types.ts` for local feature types/constants that do not belong in shared packages.

## 10. When To Use Domain Folder (Queries vs Commands)

Use domain files for reusable business data access that multiple modules/features may call.

Choose `queries.model.ts` when:

- Operation is read-only.
- Used by resolveResources, list endpoints, detail endpoints, search/filter flows.
- Returns data needed by policies/controllers without mutating state.

Choose `commands.model.ts` when:

- Operation performs direct data mutation (insert/update/delete).
- You want reusable write primitives that multiple services can orchestrate.
- You need transactional write helpers that are still domain-level building blocks.

Keep logic in feature service files when:

- It is workflow orchestration, not just raw data access.
- It combines validation, state transitions, side effects, queueing, and logs.
- It is tightly coupled to one feature journey/API action.

Quick rule of thumb:

- If it reads only and can be reused broadly -> domain queries.
- If it writes as a reusable primitive -> domain commands.
- If it coordinates a full use-case flow -> feature service.

### Examples From This Repository

- Domain queries example:
  - `src/domain/auth/email-verification-tokens/email-verification-tokens.queries.ts`
  - Use this for read/list/existence operations such as `emailVerificationTokensExist` and `getEmailVerificationTokensList`.
- Domain model compatibility export example:
  - `src/domain/auth/email-verification-tokens/models/email-verification-tokens-queries.model.ts`
  - Keep this as a re-export shim when migrating paths to avoid breaking old imports.
- Feature orchestration service examples:
  - `src/modules/auth/features/F1001-signup/services/create-email-verification-token.service.ts`
  - `src/modules/auth/features/F1001-signup/services/resend-email-verification-token.service.ts`
  - `src/modules/auth/features/F1001-signup/services/cancel-email-verification-token.service.ts`
  - `src/modules/auth/features/F1001-signup/services/remove-email-verification-token.service.ts`
  - These files coordinate validation, transitions, queueing, and logs.
- Feature persistence helper example:
  - `src/modules/auth/features/F1001-signup/services/email-verification-token-lifecycle.persistence.ts`
  - Use `persistence` naming when the file contains DB operations plus durable side effects (audit/events/failure-state writes), not just plain repository CRUD.

---

## 11. Checklist for a New Endpoint

- [ ] Existence function created in the correct `domain/.../models/` file
- [ ] Existence function selects all fields the controller + policy need (no extras)
- [ ] Route uses correct middleware order: `isAuthenticated → hasPermission → resolveResources → authorize → controller`
- [ ] Bulk body routes use `{ source: "body" }` and a flat path (no `:id` param)
- [ ] Policy function uses only `PolicyContext` fields — no direct DB access
- [ ] Controller reads from `res.locals.resourceData`, not `req.params`/`req.body` for resolved data
- [ ] Controller performs all in-memory filtering before calling the service
- [ ] Service receives pre-computed data and only performs mutations
- [ ] `PERMISSIONS.*` constant used in `hasPermission` matches the correct domain module
- [ ] For list endpoints: pagination/filter/sort/count behavior follows `docs/instructions/paginated-list-api-standard.md`
