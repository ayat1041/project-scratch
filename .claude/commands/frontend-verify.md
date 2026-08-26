---
description: Run the full frontend verification gate — package build, lint, type-check, Next build, tests — plus the manual checks no tool catches.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Frontend Verify

The gate before a frontend change is called done. Run every step. Report actual output — never describe a failing step as passing.

## Step 1 — Shared packages (only if `packages/` changed)

```bash
pnpm --filter @repo/schemas-types build
```

A contract change that does not build cannot be consumed. Fix it here.

## Step 2 — Lint

```bash
pnpm --filter frontend lint
```

## Step 3 — Types

```bash
pnpm --filter frontend check-types
```

This is what surfaces every consumer a contract change broke — including in `apps/backend` and `apps/admin` if the change touched `packages/`. Run their type-checks too when it did.

## Step 4 — Build

```bash
pnpm --filter frontend build
```

Non-skippable. It is the **only** step that catches a missing `<Suspense>` boundary around a `useSearchParams` consumer (`missing-suspense-with-csr-bailout`), which `dev` renders happily.

## Step 5 — Tests

```bash
pnpm --filter frontend test
```

## Step 6 — Manual checks

Tooling cannot see these. Confirm each explicitly:

- [ ] Every request payload type and response type comes from `@repo/schemas-types` — no local redefinition
- [ ] No component imports `api/` or `services/` directly
- [ ] No handler imports `api/` directly
- [ ] `sonner` appears only under `handlers/`
- [ ] Every `catch` in a handler calls `handleErrorToast` **and** `throw error`
- [ ] `wrapZodError` re-throws non-Zod errors unchanged
- [ ] Every dialog not on first paint uses `next/dynamic`
- [ ] A section context exists only where siblings genuinely share state
- [ ] Filters, search, and pagination live in the URL, not `useState`
- [ ] Ownership branching happens only at `page.tsx`
- [ ] Every rendered `data-testid` comes from `utils/testids.ts`
- [ ] The module is registered in `apps/frontend/instructions/module-directory.instructions.md`

## Step 7 — Deeper passes

```
/frontend-audit                 layer + anti-pattern audit
/review-impact-frontend         blast radius of the changed files
```

## Step 8 — Report

```
## Frontend Verify

| Step | Result |
|---|---|
| @repo/schemas-types build | PASS / FAIL / N/A |
| lint | PASS / FAIL |
| check-types | PASS / FAIL |
| build | PASS / FAIL |
| test | PASS / FAIL (x/y) |

### Failures
<command, error output, file:line>

### Manual checks
<any unchecked box, with the reason>

### Verdict
[ ] READY   [ ] NOT READY
```

`NOT READY` if any step failed or any manual check is unmet. State what is incomplete rather than rounding up to done.
