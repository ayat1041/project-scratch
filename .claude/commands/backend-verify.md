---
description: Run the full backend verification gate — package builds, backend build (the type gate), tests, spec-drift checks, plus the manual checks no tool catches.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Backend Verify

The gate before a backend change is called done. Run every step. Report actual output — never describe a failing step as passing.

## Step 1 — Shared packages (only if `packages/` changed)

```bash
pnpm --filter @repo/schemas-types build
pnpm --filter @repo/constants build
```

A contract change that does not build cannot be consumed.

## Step 2 — Build — this is the type gate

```bash
pnpm --filter backend build     # tsc && tsc-alias
```

**There is no `check-types` script on backend.** `pnpm --filter backend check-types` fails; `build` is what type-checks. It is also the only step that catches type errors in tests, because Jest runs with `diagnostics: false`.

## Step 3 — Lint

```bash
pnpm --filter backend lint      # eslint --fix — REWRITES FILES
```

This mutates the working tree. Run it before reviewing the diff, and re-check `git diff` afterwards so autofixes do not ship unreviewed.

## Step 4 — Tests

```bash
pnpm --filter backend test              # node:test — needs local Postgres/Redis/Qdrant up
pnpm --filter backend test:integration  # Jest — integration/ folders only
```

If the local stack is not running, say so rather than reporting the suite as skipped-and-fine. A test file in the wrong folder runs under neither runner — confirm new tests actually executed.

## Step 5 — Spec drift

```bash
pnpm --filter backend check:spec-drift
pnpm --filter backend check:spec-stale
```

## Step 6 — Migrations (only if the schema changed)

- [ ] Generated SQL under `drizzle/migrations/` was **read**, not just generated
- [ ] No unintended `DROP COLUMN` / `DROP TABLE`, no data loss, stable constraint names
- [ ] Nothing hand-edited in `*.sql` or `meta/`
- [ ] New tables exported from `src/db/schema/index.ts`
- [ ] Entity types updated in `@repo/schemas-types` and rebuilt
- [ ] Schema change and generated SQL committed together
- [ ] Any destructive operation surfaced to the user, not applied silently

## Step 7 — Manual checks

Tooling cannot see these. Confirm each explicitly:

- [ ] Middleware order unchanged: `isAuthenticated → hasPermission → resolveResources → authorize → controller`
- [ ] No controller queries the DB; all read `res.locals.resourceData`
- [ ] No service re-fetches what `resolveResources` already loaded
- [ ] No service imports another service, a policy, or a controller
- [ ] No policy touches the DB
- [ ] Every `authorize` action string exists on its policy object
- [ ] Errors thrown via `createError.*`; no `handleError`; validation is 422
- [ ] Every response uses `{ success, message, data }`
- [ ] List endpoints use the shared pagination and `counts` shape
- [ ] Queue publishes happen after transaction commit; handlers are idempotent
- [ ] New consumers have both `:dev` and production scripts **and** are wired into the launch path
- [ ] Every new or changed endpoint has a matching swagger doc

## Step 8 — Cross-app impact

If `packages/` changed, the frontend and admin are consumers too:

```bash
pnpm --filter frontend check-types
pnpm --filter admin check-types
```

Report any consumer that breaks, even when the task was backend-only.

## Step 9 — Deeper passes

```
/backend-audit              layer + anti-pattern audit
/review-impact              blast radius of the changed files
/spec-sync <feature>        reconcile FRD/TDD with the implementation
```

## Step 10 — Report

```
## Backend Verify

| Step | Result |
|---|---|
| package builds | PASS / FAIL / N/A |
| backend build (type gate) | PASS / FAIL |
| lint (--fix, rewrote files?) | PASS / FAIL |
| test (node:test) | PASS / FAIL (x/y) / STACK DOWN |
| test:integration (Jest) | PASS / FAIL (x/y) |
| check:spec-drift | PASS / WARN |
| frontend/admin check-types | PASS / FAIL / N/A |

### Failures
<command, error output, file:line>

### Manual checks
<any unchecked box, with the reason>

### Verdict
[ ] READY   [ ] NOT READY
```

`NOT READY` if any step failed or any manual check is unmet. State what is incomplete rather than rounding up to done.
