---
description: Audit cross-app boundaries — contract duplication, drifted shared logic, stale package references, and seams between backend and the two client apps.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Monorepo Audit

Read-only. Reports; does not fix. Covers what the per-app audits cannot see: the seams **between** surfaces.

For within-app violations run `/backend-audit`, `/frontend-audit`, `/admin-audit`.

## Step 1 — Resolve scope

A package name, a feature spanning surfaces, or — with no argument — the current branch diff across `apps/` and `packages/`. State the resolved scope and which surfaces it touches.

## Step 2 — Required reading

- Skill `monorepo-architecture`
- Skill `monorepo-contracts`
- Skill `monorepo-packages`

## Step 3 — Mechanical checks

Expected result **zero hits** unless noted.

| # | Check | Notes |
|---|---|---|
| 1 | `@repo/validations` or `@repo/types` imported anywhere | Neither package exists |
| 3 | `import { X as Y }` from `@repo/schemas-types` | Two names for one contract; breaks grep |
| 4 | A client's `types/domain.ts` or `validations/schemas.ts` re-exporting `@repo/schemas-types` | Those hold local code only |
| 5 | A bespoke `{ success: boolean; data?: ... }` type in any app | Must be `ApiResponse<T>` |
| 6 | `createErrorWithStatus` outside the legacy `apps/frontend/features/*/_api/` files | Must be `createApiError` |
| 7 | A `dist/` file edited by hand | Regenerate |
| 8 | Hand-edited SQL in `drizzle/migrations/` or anything in `meta/` | |
| 9 | An internal dependency pinned to a version instead of `workspace:*` | |
| 10 | A package script named `type-check` instead of `check-types` | `@repo/utilities` is the known offender — root `check-types` skips it |
| 11 | A secret, token, or credential in tracked files | Report immediately, do not quote the value |
| 12 | Non-`NEXT_PUBLIC_` env var read from client-side code | Server-only values leaking to the bundle |

## Step 4 — Contract seam checks

Need reading across surfaces:

- **Duplicated contract** — a type, Zod schema, status union, or display-label map declared in an app when an equivalent exists in `@repo/schemas-types` / `@repo/constants`. Check all three apps for the same concept under different names.
- **Response-type truth** — does the backend controller actually return what the response type promises? A type promising a field nobody sends type-checks fine and is `undefined` at runtime.
- **Unbuilt contract** — is `packages/schemas-types/dist` older than `src`? Consumers are compiling against a stale contract.
- **Client-side rule duplication** — a validation rule re-implemented in a frontend or admin form that the backend already enforces via a shared schema.
- **Hardcoded display strings** — a client rendering its own status/filter labels instead of the `label` returned in the backend's `counts` array.
- **Copy-paste across apps** — the same helper or component in both `apps/frontend` and `apps/admin` instead of `@repo/utilities` / `@repo/ui`.
- **Divergent envelopes** — an endpoint whose response shape one client can narrow and the other cannot.
- **Swagger truth** — documented path, permissions, status codes, and examples versus the actual route, policy, and schema.

## Step 5 — Consistency checks

- **Stale instruction docs** — an instruction file naming a package, script, or symbol that no longer exists. Report the file and the claim; these mislead every future change.
- **Feature ID series** — a backend feature folder outside its domain's existing `F<NNNN>-` series.
- **Spec chain** — a feature with code but no FRD/TDD, or an FRD materially behind the implementation. `pnpm --filter backend check:spec-stale` gives the git-history heuristic.
- **Commit coupling** — a schema edit without its migration, or a contract change without its consumers, in the same branch.

## Step 6 — Report

```
## Monorepo Audit: <scope>

### Surfaces touched
backend / frontend / admin / packages

### Blocking
- <file:line> — <rule> — <why it breaks> — <fix>

### Warning
- ...

### Stale documentation
- <doc:line> — <claim> — <reality>

### Clean
- <checks that passed, one line>

### Verdict
[ ] CLEAN   [ ] CHANGES REQUIRED
```

Order by severity, cite `file:line`, and confirm every finding by reading the code — a grep hit inside a comment or a string is not a violation. Where a finding is legacy debt rather than a new regression (the `apps/frontend/features/` tree, for instance), label it as such rather than blocking on it.
