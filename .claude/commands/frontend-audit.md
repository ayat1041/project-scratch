---
description: Audit a frontend module (or the current diff) for layer-order violations, toast-boundary breaks, contract duplication, and the documented anti-patterns.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Frontend Layer Audit

Read-only. Reports; does not fix. Pair with `/frontend-verify` for the build gates.

## Step 1 — Resolve scope

Target is a module path (`user-management/user-preferences`), a file list, or — with no argument — the current branch diff under `apps/frontend/`. State the resolved scope before auditing.

**Which tree is it in?**

- `apps/frontend/modules/**` — current conventions. Audit fully.
- `apps/frontend/features/**` — the legacy tree (pre-migration modules): `_api/`, `_handlers/`, local `createErrorWithStatus`, `sonner` in a hook. Report findings as **legacy debt**, not as blocking. Migrating one of these is its own task; do not fold it into an unrelated change.

**Known-good exception:** `app/layout.tsx` imports `sonner` to mount `<Toaster />`. That is correct and is not a toast-boundary violation.

## Step 2 — Required reading

- Skill `frontend-architecture` (dependency rules)
- `apps/frontend/instructions/module-architecture-and-layers.instructions.md` §7, §11

## Step 3 — Run the mechanical checks

Each is a grep with an expected result of **zero hits** unless noted.

| # | Check | Expectation |
|---|---|---|
| 1 | `sonner` imported outside `handlers/` | 0, excluding `app/layout.tsx` (the `<Toaster />` mount). A client-side business rule with no API call is a review flag, not an auto-fail. |
| 2 | `components/` importing `../services` or `../api` | 0 |
| 3 | `handlers/` importing `../api` | 0 |
| 4 | `services/` importing `sonner`, `react`, or a component | 0 |
| 5 | `utils/` importing any module layer | 0 |
| 6 | Section context importing a service or `api/` | 0 |
| 7 | `createErrorWithStatus` defined locally | 0 in `modules/`. Any legacy `features/*/_api/` files still define it — legacy debt, report as such. Current code must use `createApiError` from `@repo/utilities/error-handling`. |
| 8 | `catch` calling `handleErrorToast` without a following `throw` | 0 |
| 9 | `wrapZodError` re-wrapping non-Zod errors in `new Error(...)` | 0 — must be `throw error` |
| 10 | `types/domain.ts` or `validations/schemas.ts` re-exporting `@repo/schemas-types` | 0 |
| 11 | `import { X as Y } from '@repo/schemas-types/...'` | 0 |
| 12 | Local `{ success: boolean; data?: ... }` response type | 0 — must be `ApiResponse<T>` |
| 13 | `response.data?.` without a preceding `if (response.success)` | 0 |
| 14 | Dialog imported statically into a section | 0 — must be `next/dynamic` |
| 15 | `NEXT_PUBLIC_API_URL` used inside `api-constants.ts` | 0 — the fetch helper prefixes it |
| 16 | Bare `fetch(` to a backend path outside `api/` and `app/api/` | 0 |
| 17 | `eslint-disable` on a `useEffect` dependency array | 0 |
| 18 | Raw `data-testid="..."` string literal in a component | 0 — must come from `utils/testids.ts` |
| 19 | Cross-feature import via relative `../../<other-feature>/` | 0 |
| 20 | Feature code imported from `app/` with a relative path | 0 — must use `@modules` |
| 21 | `'use client'` on a file with no state/effect/handler/browser API | 0 |
| 22 | `useSearchParams` consumer with no `<Suspense>` ancestor | 0 |
| 23 | A handler named `handleGet*` / `handleFetch*` | 0 — reads belong in a hook |
| 24 | `refetchInterval` with no conditional guard | 0 |

## Step 4 — Run the judgment checks

These need reading, not grepping:

- **One component per file** — a named, multi-line function with its own props interface returning JSX, defined alongside the exported component.
- **Prop drilling** — a declared prop the component never reads, only forwards.
- **Presenter purity** — fetching, selection state, or business logic in a `*Presenter.tsx`.
- **Query key completeness** — a param used inside `queryFn` that is absent from `queryKey`.
- **Race guards** — a user-typed async check with no version ref or `AbortController`.
- **Contract duplication** — a locally declared type or Zod schema that already exists in `@repo/schemas-types`.
- **Toast copy** — a handler building its own count/pluralized sentence instead of using `result.message`.
- **Ownership leakage** — an owner/visitor check below `page.tsx`.
- **URL state** — filters, search, or pagination held in `useState`.

## Step 5 — Report

```
## Frontend Audit: <scope>

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

Order by severity. Cite `file:line` for every finding. Do not report a finding you have not confirmed by reading the code — a grep hit inside a comment or a string is not a violation.
