---
name: frontend-architecture
description: Entry point and router for any work inside apps/frontend. Use before creating a module, adding a layer, moving a file, or deciding where code belongs. Resolves the layer stack (L1 route entry → L8 route handler), the three module patterns (4A/4B/4C), the dependency and toast rules, and points to the per-layer skill.
---

# Frontend Architecture — Orientation

Scope: `apps/frontend/**`. Feature code lives in `modules/`, **never** in `app/`.
`app/` holds routing only: `layout.tsx`, `page.tsx`, and `app/api/*/route.ts`.

## The layer stack (UI → API)

Read top-down; **build bottom-up** (L0 first, L1 last).

| # | Layer | Path | Skill |
|---|---|---|---|
| L0 | Shared contracts | `packages/schemas-types`, `packages/constants` | `frontend-contracts` |
| L1 | Route entry | `app/<domain>/(<group>)/<feature>/page.tsx`, `layout.tsx` | `frontend-route-entry` |
| L2 | Components | `modules/<domain>/<feature>/components/` | `frontend-components` |
| L3 | Section context | `components/(<entity>)/<Entity>SectionContext.tsx` | `frontend-section-context` |
| L4 | Hooks | `modules/<domain>/<feature>/hooks/` | `frontend-hooks` |
| L5 | Handlers | `modules/<domain>/<feature>/handlers/` | `frontend-handlers` |
| L6 | Services | `modules/<domain>/<feature>/services/` | `frontend-services` |
| L7 | API transport | `modules/<domain>/<feature>/api/` | `frontend-api-layer` |
| L8 | Next.js route handlers | `app/api/<name>/route.ts` | `frontend-route-handlers` |

Cross-cutting: `frontend-error-handling`, `frontend-testids-and-testing`.

## Two paths through the stack

```
MUTATE   Component (L2) → Handler (L5) → Service (L6) → API (L7) → backend
READ     Component (L2) → Hook (L4)    → Service (L6) → API (L7) → backend
READ SSR page.tsx (L1)  → Service (L6) → fetchWithCookiesServer   → backend
```

There is **no read handler** — a handler exists only to toast, and a page load must not toast.

## Dependency rules

```
ALLOWED
  Component → Handler → Service → API
  Component → Hook    → Service → API
  Component → Section context → Hook
  Service   → validations/schemas.ts (local schema values)
  Any layer → types/domain.ts, utils/, @repo/schemas-types, @repo/constants, @repo/ui, @repo/utilities
  Component/Hook → <domain>/private/handlers/   (immediate parent only, shared stack)

FORBIDDEN
  Component → Service or API        (skips layers)
  Handler   → API                   (skips service validation)
  Service   → Component or Hook     (upward dependency)
  utils/    → any module layer
  Section context → Service or API  (contexts consume hooks, never fetch)
  Feature A → Feature B's internals via relative ../
  Module    → sibling module's layers (only parent private/ allowed)
```

## Non-negotiable rules

- **Toast rule** — `sonner` is imported **only** in `handlers/`. Copy comes from the API response `message` field; handlers never invent wording or pluralization.
- **Fetch rule** — `fetchWithCookiesServer` (from `@repo/utilities/http/fetch-with-cookies-server`) in `api/` or a parent `private/services/`; `fetchWithCookies` / `api` (from `@repo/utilities/http/fetch-with-cookies`) in `api/` for client reads and mutations.
- **URL-state rule** — `search` / `status` / `limit` / `offset` live in the URL, written by the shared `Filter` component and read by a `use<Feature>QueryParams` hook. Never mirrored in React state or context.
- **Suspense rule** — any client component reading `useSearchParams` (directly, via `use<Feature>QueryParams`, or via shared `Filter`/`Pagination`) must render under `<Suspense>`, or `next build` fails with `missing-suspense-with-csr-bailout`. A provider mounted in `layout.tsx` needs its own boundary **in that layout** — a boundary inside `page.tsx` cannot cover its layout ancestor.
- **Server default** — no `'use client'` unless the file needs state, effects, event handlers, browser APIs, or context.
- **Dynamic dialogs** — every modal not needed for first paint uses `next/dynamic`.
- **Import alias** — `@modules/*` (and `@/modules/*`) from `app/` and across features; relative paths only *within* one feature folder.

## Module patterns — pick before creating a folder

| Pattern | Use when | Reference |
|---|---|---|
| **4A Full-Stack Profile** | Public visitor view + authenticated owner edit view on the same route | `modules/user-management/profile/` (hypothetical — public profile view + owner edit view of a user) |
| **4B Standalone CRUD** | Private page with tabs, filtered/paginated table, bulk actions | `modules/user-management/users/` (hypothetical — illustrative shape) |
| **4C Lightweight List-Page** | Private page: searchable table + add/edit dialog; sub-module owns `api/` + `services/` + `handlers/` | `modules/user-management/api-keys/`, `modules/user-management/user-preferences/` (hypothetical) |

## Two trees — `modules/` is current, `features/` is legacy

| Tree | Convention |
|---|---|
| `modules/` | **Current.** Layer folders unprefixed: `api/`, `services/`, `handlers/`. Uses `createApiError`. |
| `features/` | **Legacy — fully retired.** Its modules were underscore-prefixed (`_api/`, `_handlers/`), used a local `createErrorWithStatus`, and had at least one hook importing `sonner`. The tree has been removed entirely; there is nothing left to migrate. |

Build everything new in `modules/`. If a `features/`-shaped module ever reappears (e.g. restored from history), do not replicate its conventions, and do not "fix" it in passing — migrating one is its own task.

## Folder shape

```
modules/<domain>/<feature>/
├── api/            api-constants.ts + <domain>-api.ts
├── services/       <feature>-service.ts (+ index.ts barrel if >1 file)
├── handlers/       <area>.handlers.ts   (+ index.ts barrel if >1 file)
├── hooks/          use<Feature>Query.ts, use<Feature>QueryParams.ts
├── types/          domain.ts            local types + composite DTOs ONLY
├── validations/    schemas.ts           UI-only constants + local Zod ONLY
├── constants/
├── utils/          helpers.ts, testids.ts
└── components/     pages/ + (zone)/ folders + dialogs/
```

No underscore prefixes on layer folders — the real tree uses `api/`, `services/`, `handlers/`.
No `_resources/` wrapper. Shared cross-module code goes in `modules/<domain>/common/`.

## Source-of-truth docs

Read the relevant one before changing that area — they outrank this skill on detail:

| Doc | Covers |
|---|---|
| `apps/frontend/instructions/module-architecture-and-layers.instructions.md` | **Authoritative** layer contracts, dependency rules, anti-patterns |
| `apps/frontend/instructions/naming-conventions.instructions.md` | Files, folders, symbols, types, constants |
| `apps/frontend/instructions/frontend-error-handling.instructions.md` | All four error display modes |
| `apps/frontend/instructions/type-flow.instructions.md` | `@repo/schemas-types` structure, full-stack implementation order |
| `apps/frontend/instructions/module-directory.instructions.md` | Where each module lives; register new ones here |

**Known doc drift** — where these disagree, `module-architecture-and-layers.instructions.md` wins:

- `frontend-agents.instructions.md` says `types/domain.ts` and `validations/schemas.ts` re-export from `@repo/schemas-types`. They do **not** — re-exporting is listed as an anti-pattern. Import package types and schema values directly at the call site, canonical name, no alias.
- `frontend-agents.instructions.md` says `createErrorWithStatus`. The real export is `createApiError` from `@repo/utilities/errors/error-parsing`. A local `createErrorWithStatus` survives in the three legacy `features/*/_api/` files — that is the anti-pattern the docs name, not a precedent.
- `naming-conventions.instructions.md` §2 is headed "underscore prefix — always" but its own example block and all of `modules/` use no underscore. No underscore. Only the legacy `features/` tree is prefixed.
- `frontend-error-handling.instructions.md` documents an `AuthApiError` class and a `parseSignInError` helper for field-level auth errors. **Neither exists anywhere in the repo** — `modules/auth/handlers/sign-in.handlers.ts` currently toasts via `handleErrorToast` like any other handler. Treat the `AuthApiError` pattern as a target design, not as callable code: if a task needs it, it has to be built first.

## Verification gate

```bash
pnpm --filter frontend lint
pnpm --filter frontend check-types
pnpm --filter frontend build
```

Run `lint` + `check-types` after any change; add `build` before calling work done (it is the only step that catches the Suspense bailout).
