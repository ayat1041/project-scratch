---
description: Add a reusable domain query or write command in apps/backend/src/domain — including an existence-check function for resolveResources.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Backend Domain Query / Command (B6)

## Step 1 — Confirm the layer

| The operation | Goes to |
|---|---|
| Read-only, reusable across features | `domain/.../models/<resource>-queries.model.ts` — continue |
| Write primitive, reusable across features | `domain/.../models/<resource>-commands.model.ts` — continue |
| Coordinates a whole use-case (validate → transition → side effects → queue → log) | A feature service — stop, use `/create-endpoint` |
| Narrow CRUD for one aggregate, used by one feature only | `<feature>.repository.ts` in that feature — stop |

## Step 2 — Gather inputs

- Domain and subdomain (`users/roles`, `users/users-email-verification`, …)
- Resource name
- Is this an existence check for `resolveResources`?
- Exactly which fields the callers need — controller filters, policy checks, response payload
- Does a caller need to pass a transaction handle?

## Step 3 — Required reading

- Skill `backend-queries`
- Skill `backend-auth-and-policies` (if writing an existence check)
- Skill `backend-list-endpoints` (if this is a list read)
- The existing model file for that resource — extend it rather than adding a parallel one

## Step 4 — Check for an existing function first

Grep `src/domain/` for the resource and for near-miss names. Two services duplicating a query is exactly what this layer exists to prevent. If a suitable function exists, stop and report it.

## Step 5a — Existence check

```typescript
import { ExistenceCheckResult } from "@/middleware/resolve-resource.middleware";

export const apiKeysExist = async (
  ids: string[],
): Promise<ExistenceCheckResult<ApiKeyData>> => {
  const records = await db
    .select({
      id: appApiKeysTable.id,
      userId: appApiKeysTable.userId,
      status: appApiKeysTable.status,      // controller filters on this
    })
    .from(appApiKeysTable)
    .where(inArray(appApiKeysTable.id, ids));

  return {
    resources: records.map((record) => ({
      resourceId: record.id,
      userId: record.userId ?? null,
      organizationId: null,
      data: record,
    })),
  };
};
```

- Select **exactly** what the controller and policy read — this runs on every request to the route.
- Include the fields the controller will filter on; that is what removes the second query.
- Always set `organizationId` for org-scoped resources — `authorize` and the controller both read it.

## Step 5b — List read

Follow `backend-list-endpoints`: typed params in, base scoping separated from optional filters, one `whereConditions` reused by the data query, the count query, and the summary, sorting through `resolveSortableColumn` with a deterministic secondary sort, and an optional `dbOrTx` parameter.

## Step 5c — Write command

One data operation. Accept an optional transaction handle so a service can compose it. No orchestration, no queue publishing, no logging beyond what the write itself needs.

## Step 6 — Constraints

- Plain arguments in, plain data out — no `req`, no `res`, no HTTP concepts
- **No `createError.*`** — a missing row returns empty; the caller decides whether that is a 404
- No imports from `modules/` — the dependency runs one way
- No validation here; params arrive validated
- Keep a re-export shim if you move an existing path, so current imports keep working

## Step 7 — Verify

```bash
pnpm --filter backend build
pnpm --filter backend test:services
```

## Step 8 — Report

- Function name, file, and signature.
- Fields selected and which caller needs each.
- Next: `/backend-policy` if authorization needs a new action, else `/create-endpoint`.
