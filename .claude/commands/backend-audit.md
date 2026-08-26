---
description: Audit a backend feature (or the current diff) for lifecycle violations, layer-boundary breaks, re-fetching, forbidden helpers, and the documented anti-patterns.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Backend Audit

Read-only. Reports; does not fix. Pair with `/backend-verify` for the build and test gates.

## Step 1 — Resolve scope

A feature path (`user-management/features/F6003-api-keys`), a file list, or — with no argument — the current branch diff under `apps/backend/`. State the resolved scope before auditing.

## Step 2 — Required reading

- Skill `backend-architecture` (lifecycle, layer boundaries)
- `.github/instructions/api-workflow.instructions.md` §11

## Step 3 — Mechanical checks

Expected result is **zero hits** unless noted.

| # | Check | Notes |
|---|---|---|
| 1 | Middleware chain out of order in any `.routes.ts` | Must be `isAuthenticated → hasPermission → resolveResources → authorize → controller` |
| 2 | A `db.` call inside a `*.controller.ts` | Controllers never query |
| 3 | Controller not wrapped in `asyncHandler` | |
| 4 | `try/catch` in a controller | Only legitimate when genuinely converting an error |
| 5 | `handleError(` anywhere | Forbidden — use `createError.*` |
| 6 | `throw new Error(` on a request path | Loses the status; becomes a 500 |
| 7 | A service importing another service | Lift the shared part into `domain/.../models/` |
| 8 | A service importing a policy or a controller | |
| 9 | `req.` or `res.locals` referenced inside a `*.service.ts` | Controller passes arguments |
| 10 | A `select` in a service for a record `resolveResources` already resolved | Re-fetch |
| 11 | `createError.` thrown from a `*queries.model.ts` | Domain reads return empty; the caller decides |
| 12 | A domain model importing from `modules/` | Dependency runs one way |
| 13 | Permission string literal in a route instead of `PERMISSIONS.*` | |
| 14 | A `db.` call inside a `*.policy.ts` | Policies read `PolicyContext` only |
| 15 | `authorize(policy, "action")` where the action key is absent from the policy object | Fails at runtime, not build |
| 16 | Raw `req.params.x` / `req.query.x` passed on without coercion | Express 5 types these `string \| string[]` |
| 17 | Raw `req.query` / `req.params` read inside a domain query | |
| 18 | `validation` error mapped to 400 instead of 422 | Breaks client 422 rendering |
| 19 | A bespoke response shape instead of `{ success, message, data }` | Breaks `ApiResponse<T>` narrowing in frontend and admin |
| 20 | Redundant owner id in a route path when the resource carries it | |
| 21 | `select *` / over-broad select in an existence check | Runs on every request |
| 22 | List endpoint with a bespoke pagination or counts shape | Must be `totalItems`/`totalPages` + `counts: { ... }` |
| 23 | Sparse filter-count summary | Every filterable value needs an entry, even at 0 |
| 24 | Queue publish inside a `db.transaction` | Survives rollback |
| 25 | `import "module-alias/register"` missing or not first in a worker | Runtime-only failure |
| 26 | Hand-edited SQL under `drizzle/migrations/` or any edit in `meta/` | |
| 27 | New table missing from `src/db/schema/index.ts` | |
| 28 | Integration test outside an `integration/` folder | Jest never selects it — it silently does not run |
| 29 | Endpoint with no `swagger-docs/` entry | |
| 30 | `@repo/validations` or `@repo/types` imported | Neither package exists — use `@repo/schemas-types` / `@repo/constants` |

## Step 4 — Judgment checks

These need reading, not grepping:

- **Eligibility in the wrong layer** — status filtering done in a policy or a service instead of in the controller from resolved data.
- **Existence-function field gaps** — a controller or policy needing a field the existence function does not select, patched with a second query.
- **Service doing a domain's job** — raw Drizzle in a service for something reusable.
- **Domain doing a service's job** — a "query" that orchestrates several writes plus a publish.
- **Idempotency** — a worker handler that double-processes on redelivery.
- **Transaction scope** — multi-table writes that should be atomic and are not.
- **Contract duplication** — a type or schema declared locally that already exists in `@repo/schemas-types`.
- **Swagger truth** — documented path, permissions, status codes, and examples versus the actual route, policy, and schema.
- **Feature ID** — folder prefix outside the domain's existing series.

## Step 5 — Report

```
## Backend Audit: <scope>

### Blocking
- <file:line> — <rule> — <why it breaks> — <fix>

### Warning
- ...

### Suggestion
- ...

### Clean
- <checks that passed, one line>

### Verdict
[ ] CLEAN   [ ] CHANGES REQUIRED
```

Order by severity, cite `file:line`, and confirm every finding by reading the code — a grep hit inside a comment or a string is not a violation. Note that `pnpm --filter backend lint` runs with `--fix` and rewrites files, so run the audit before linting if you need a clean diff to read.
