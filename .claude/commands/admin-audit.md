---
description: Audit an admin module (or the current diff) for layer violations, Client-boundary misplacement, toast-boundary breaks, and the documented anti-patterns.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Admin Audit

Read-only. Reports; does not fix. Pair with `/admin-verify` for the build gates.

## Step 1 — Resolve scope

A module path (`user-management/roles`), a file list, or — with no argument — the current branch diff under `apps/admin/`. State the resolved scope.

**Known-good exception:** `app/layout.tsx` imports `sonner` to mount `<Toaster />`. That is correct, not a violation.

## Step 2 — Required reading

- Skill `admin-architecture` (layer order and the SSR-read exception)
- `apps/admin/instructions/admin-agents.instructions.md`

## Step 3 — Mechanical checks

Expected result **zero hits** unless noted.

| # | Check | Notes |
|---|---|---|
| 1 | `sonner` imported outside `handlers/` | Excluding `app/layout.tsx` |
| 2 | A **client** component importing `../services` or `../api` | A Server Presenter calling the service is the sanctioned exception |
| 3 | `handlers/` importing `../api` | Skips service validation |
| 4 | `services/` importing `sonner`, `react`, or a component | |
| 5 | `utils/` importing any module layer | |
| 6 | `'use client'` in `Presenter.tsx` | The Presenter must stay a Server Component |
| 7 | `'use client'` in `(filter)/index.tsx` when it only builds config from props | Needless client bundle |
| 8 | `'use client'` on a row/content file that uses no client API | Being in a client subtree does not require it |
| 9 | `@tanstack/react-query` imported | Not used in admin — reads are SSR |
| 10 | `searchParams` values mirrored into `useState` | The Presenter read them server-side |
| 11 | `createErrorWithStatus` defined or imported | Must be `createApiError` from `@repo/utilities/error-handling` |
| 12 | `catch` calling `handleErrorToast` with no following `throw` | |
| 13 | Non-Zod error re-wrapped in `new Error(...)` in a service | Strips `.status`, breaks 422 rendering |
| 14 | Local `{ success: boolean; data?: ... }` response type | Use the canonical type from `@repo/schemas-types` |
| 15 | `response.data?.` with no preceding `if (response.success)` | |
| 16 | `NEXT_PUBLIC_API_URL` used inside `api-constants.ts` | The fetch helper prefixes it |
| 17 | `fetchWithCookiesServer` reachable from a client path | `next/headers` is server-only |
| 18 | Bare `fetch(` to a backend path outside `api/` and `app/api/` | |
| 19 | Static dialog import in a table or row | Must be `next/dynamic` |
| 20 | Raw `data-testid="..."` literal in a component | Must come from `utils/testids.ts` |
| 21 | Cross-module import via relative `../../<other-module>/` | Use `@modules/...` |
| 22 | Module code imported from `app/` with a relative path | Use `@modules/...` |
| 23 | `eslint-disable` on a `useEffect` dependency array | |
| 24 | A handler named `handleGet*` / `handleFetch*` | Reads go through the Presenter |
| 25 | `@repo/validations` or `@repo/types` imported | Neither package exists |

## Step 4 — Judgment checks

Need reading, not grepping:

- **Client boundary placement** — is `'use client'` at `(table)/index.tsx`, or has it crept upward into the Presenter or downward into every row?
- **Presenter purity** — fetching beyond the single service call, selection state, or business logic inside `Presenter.tsx`.
- **Empty vs. error** — does a failed SSR read render identically to an empty result? An admin acting on "no submissions" when the API is down is a real failure.
- **One component per file** — a named, multi-line function with its own props interface defined alongside the exported component.
- **Prop drilling** — props declared but never read, forwarded across the structural client hop instead of bundled into an object prop.
- **Status mapping duplication** — backend→display mapping inline in a component instead of the shared map in `constants/`.
- **Role-sensitive UI** — an action rendered for a role that cannot perform it; a role branch inside a leaf component instead of at the route.
- **Destructive actions** — a mutation wired straight to a handler with no confirm dialog.
- **Contract duplication** — a type or schema declared locally that already exists in `@repo/schemas-types`.
- **Toast copy** — a handler building its own count sentence instead of using `result.message`.

## Step 5 — Report

```
## Admin Audit: <scope>

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

Order by severity, cite `file:line`, and confirm each finding by reading the code — a grep hit inside a comment or string is not a violation.
