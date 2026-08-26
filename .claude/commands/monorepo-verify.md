---
description: Run the full repo-wide verification gate across packages, backend, frontend, and admin — the complete gate before merging a change that spans surfaces.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Monorepo Verify

The gate before a cross-surface change is called done. Run every step. Report actual output — never describe a failing step as passing.

For a single-surface change, `/backend-verify`, `/frontend-verify`, or `/admin-verify` is enough.

## Step 1 — Install, if dependencies changed

```bash
pnpm install
```

## Step 2 — Packages, in dependency order

```bash
pnpm --filter @repo/constants build
pnpm --filter @repo/utilities build
pnpm --filter @repo/schemas-types build
```

Or `pnpm build:packages`, which runs exactly these three. A build-required package is invisible to consumers until built — this step first, always.

## Step 3 — Backend

```bash
pnpm --filter backend build          # tsc && tsc-alias — the ONLY backend type gate
pnpm --filter backend lint           # eslint --fix — REWRITES FILES
pnpm --filter backend test
pnpm --filter backend test:integration
pnpm --filter backend check:spec-drift
```

**`pnpm --filter backend check-types` does not exist.** `build` is the type gate. `lint` mutates the working tree — re-check `git diff` after it so autofixes do not ship unreviewed. `test` needs local Postgres, Redis, and Qdrant; if the stack is down, say so rather than reporting the suite as fine.

## Step 4 — Frontend

```bash
pnpm --filter frontend check-types
pnpm --filter frontend lint
pnpm --filter frontend build          # only step that catches a missing <Suspense> boundary
pnpm --filter frontend test
```

## Step 5 — Admin

```bash
pnpm --filter admin check-types
pnpm --filter admin lint
pnpm --filter admin build             # also catches next/headers leaking into a client path
pnpm --filter admin test
```

## Step 6 — Why not just `pnpm check-types`?

The root task **does not cover the backend** (no such script) and **skips `@repo/utilities`** (its script is named `type-check`). A green root run is not full coverage. Run the per-surface commands above.

`pnpm build` at the root is a valid extra check — turbo respects `^build` ordering — but it does not replace the test and lint steps.

## Step 7 — Manual checks

- [ ] Contract changes were authored in `packages/` **before** app code
- [ ] Every consumer of a changed export is updated in this same change
- [ ] No type or schema redefined locally that exists in `@repo/schemas-types`
- [ ] No client re-implements a validation rule the backend enforces
- [ ] Status/filter labels come from the backend, not client-side strings
- [ ] Backend responses all use `{ success, message, data }`; both clients narrow before `.data`
- [ ] Schema change and its generated migration are committed together
- [ ] Generated SQL was read; no unintended DROP, no data loss
- [ ] Any destructive DB operation was surfaced to the user, not applied silently
- [ ] No secrets, tokens, or credentials in tracked files
- [ ] No non-`NEXT_PUBLIC_` env var read from client code
- [ ] Swagger docs match the actual routes, permissions, and status codes
- [ ] Pre-commit warnings (spec-drift, spec-stale, AC-trace) addressed, not ignored

## Step 8 — Deeper passes

```
/monorepo-audit             cross-app seams, contract duplication, stale references
/backend-audit  /frontend-audit  /admin-audit
/review-impact  /review-impact-frontend  /review-impact-admin
/spec-sync <feature>
```

## Step 9 — Report

```
## Monorepo Verify

| Surface | Step | Result |
|---|---|---|
| packages | constants / utilities / schemas-types build | PASS / FAIL |
| backend | build (type gate) | PASS / FAIL |
| backend | lint (--fix, rewrote files?) | PASS / FAIL |
| backend | test / test:integration | PASS / FAIL (x/y) / STACK DOWN |
| backend | check:spec-drift | PASS / WARN |
| frontend | check-types / lint / build / test | PASS / FAIL |
| admin | check-types / lint / build / test | PASS / FAIL |

### Failures
<command, error output, file:line>

### Manual checks
<any unchecked box, with the reason>

### Verdict
[ ] READY   [ ] NOT READY
```

`NOT READY` if any step failed or any manual check is unmet. State exactly what is incomplete rather than rounding up to done.
