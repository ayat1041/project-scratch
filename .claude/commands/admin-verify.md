---
description: Run the full admin verification gate — package build, lint, type-check, Next build, tests — plus the manual checks no tool catches.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Admin Verify

The gate before an admin change is called done. Run every step. Report actual output — never describe a failing step as passing.

## Step 1 — Shared packages (only if `packages/` changed)

```bash
pnpm --filter @repo/schemas-types build
pnpm --filter @repo/constants build
```

## Step 2 — Lint

```bash
pnpm --filter admin lint
```

## Step 3 — Types

```bash
pnpm --filter admin check-types
```

This surfaces every consumer a contract change broke. If the change touched `packages/`, run the sibling apps too — see Step 6.

## Step 4 — Build

```bash
pnpm --filter admin build
```

Non-skippable. It is the only step that catches a missing `<Suspense>` boundary around a `useSearchParams` consumer (`missing-suspense-with-csr-bailout`), which `dev` renders happily. It also catches a server-only import (`next/headers`, `fetchWithCookiesServer`) that leaked into a client path.

## Step 5 — Tests

```bash
pnpm --filter admin test
```

## Step 6 — Cross-app impact

`packages/` is shared with the backend and the frontend:

```bash
pnpm --filter frontend check-types
pnpm --filter backend build
```

Report any consumer that breaks, even when the task was admin-only.

## Step 7 — Manual checks

Tooling cannot see these. Confirm each explicitly:

- [ ] `Presenter.tsx` is still a Server Component — no `'use client'`
- [ ] `(filter)/index.tsx` is server-side unless it genuinely needs a client API
- [ ] `'use client'` sits at `(table)/index.tsx`, not on every row
- [ ] No React Query anywhere in admin
- [ ] `searchParams` are not mirrored into client state
- [ ] No client component imports `api/` or `services/` (the Server Presenter's service call is the sanctioned exception)
- [ ] No handler imports `api/` directly
- [ ] `sonner` appears only under `handlers/` and the `<Toaster />` mount in `app/layout.tsx`
- [ ] Every handler `catch` calls `handleErrorToast` **and** `throw error`
- [ ] Services re-throw non-Zod errors unchanged
- [ ] A failed SSR read renders differently from an empty result
- [ ] Every dialog not on first paint uses `next/dynamic`
- [ ] Destructive actions are gated by a confirm dialog in the component
- [ ] Role-sensitive actions hidden or disabled per the permission model; the branch lives at `page.tsx` or middleware
- [ ] Every rendered `data-testid` comes from `utils/testids.ts`
- [ ] Payload and response types come from `@repo/schemas-types` — no local redefinition

## Step 8 — Deeper passes

```
/admin-audit               layer + anti-pattern audit
/review-impact-admin       blast radius of the changed files
```

The `admin-reviewer` agent gives an independent read on accessibility and UX — invoke it before merge.

## Step 9 — Report

```
## Admin Verify

| Step | Result |
|---|---|
| package builds | PASS / FAIL / N/A |
| lint | PASS / FAIL |
| check-types | PASS / FAIL |
| build | PASS / FAIL |
| test | PASS / FAIL (x/y) |
| frontend / backend cross-check | PASS / FAIL / N/A |

### Failures
<command, error output, file:line>

### Manual checks
<any unchecked box, with the reason>

### Verdict
[ ] READY   [ ] NOT READY
```

`NOT READY` if any step failed or any manual check is unmet. State what is incomplete rather than rounding up to done.
