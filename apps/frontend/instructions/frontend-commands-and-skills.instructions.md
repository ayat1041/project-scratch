---
description: "Serial index of the frontend skills and slash commands, one per architecture layer from the UI level down to the API level. Says which skill governs each layer, which command builds it, and the order to run them in."
applyTo: "apps/frontend/**"
---

# Frontend Commands & Skills — Layer by Layer

> **Scope:** `apps/frontend`. The backend equivalent is `.github/instructions/command-and-agent-workflow.instructions.md`.

Skills live in `.claude/skills/<name>/SKILL.md` and load automatically when their subject matter comes up; you can also name one directly. Commands live in `.claude/commands/<name>.md` and are invoked as `/<name>`.

---

## Same app shape as `apps/admin`

`apps/frontend` and `apps/admin` are the same stack and follow **one** set of conventions.
The skill sets mirror each other layer for layer; only the paths differ.

The **two canonical module patterns are shared by both apps**. Load the matching pattern
skill before building anything:

| Need | Pattern skill | Frontend reference | Admin reference |
|---|---|---|---|
| Searchable/filterable table, fresh on navigation | `nextjs-list-page-pattern` | none yet — see below | `modules/roles/`, `.../permissions/` (not on disk yet; see `nextjs-list-page-pattern`) |
| Live data, polling, optimistic rows, shared selection | `nextjs-live-table-pattern` | none yet — see below | none yet |
| Profile page: owner-edit + public view | `frontend-components` | none yet — see below | n/a |

**`modules/auth/` is the only fully fleshed-out module tree in the repo — model file/layer
shape on it.** Neither canonical table pattern nor the hybrid profile pattern has a
filled-in reference module in this trimmed-down template yet: `app/(dashboard-shell)/profile/`
and `app/(dashboard-shell)/settings/` are 🔲 stub routes with no module behind them. See
`apps/frontend/instructions/module-directory.instructions.md` §3–4 for the illustrative
`modules/user-management/profile/` (hybrid) and `modules/user-management/api-keys/`
(live table) shapes to build the first real one from, and follow the pattern skill's
file-by-file layout directly.

---

## The layer stack

Read the stack top-down (UI → API). **Build it bottom-up** (L0 → L1) — every layer depends on the one below it.

| # | Layer | Path | Skill | Command |
|---|---|---|---|---|
| L1 | Route entry | `app/<domain>/(<group>)/<feature>/page.tsx`, `layout.tsx` | `frontend-route-entry` | `/frontend-page` |
| L2 | Components | `modules/<domain>/<feature>/components/` | `frontend-components` | `/frontend-component` |
| L3 | Section context | `components/(<entity>)/<Entity>SectionContext.tsx` | `frontend-section-context` | *(part of `/frontend-component`)* |
| L4 | Hooks | `components/(table)/use<Entity>Table.ts`, `hooks/` | `frontend-hooks` | `/frontend-hook` |
| L5 | Handlers | `modules/<domain>/<feature>/handlers/` | `frontend-handlers` | `/frontend-handler` |
| L6 | Services | `modules/<domain>/<feature>/services/` | `frontend-services` | `/frontend-service` |
| L7 | API transport | `modules/<domain>/<feature>/api/` | `frontend-api-layer` | `/frontend-api` |
| L8 | Next.js route handlers | `app/api/<name>/route.ts` | `frontend-route-handlers` | *(hand-written; L7 consumes it)* |
| L0 | Shared contracts | `packages/schemas-types`, `packages/constants` | `frontend-contracts` | `/frontend-contract` |

Cross-cutting, applying at every level:

| Aspect | Skill | Command |
|---|---|---|
| Errors — four display modes | `frontend-error-handling` | — |
| Naming — files, folders, symbols | `frontend-naming` | — |
| Test IDs and Jest tests | `frontend-testids-and-testing` | `/frontend-test` |
| Orientation, patterns, dependency rules | `frontend-architecture` | `/frontend-plan-feature` |

---

## Per layer — what governs it and what it must never do

### L0 — Contracts · `frontend-contracts` · `/frontend-contract`

Zod payload schemas and response types in `packages/schemas-types`, shared runtime enums in `packages/constants`. Built **before** any module code: `pnpm --filter @repo/schemas-types build`.

Schema VALUE `<Domain><Feature>PayloadValidationSchema`, inferred TYPE `<Domain><Feature>PayloadType`, co-located. Imported directly at the call site under the canonical name — `import` for values, `import type` for types, never `as` aliased.

**Never:** re-exported through `types/domain.ts` or `validations/schemas.ts`; redefined locally; consumed without rebuilding the package.

### L8 — Next.js route handlers · `frontend-route-handlers`

`app/api/*/route.ts`. Exists only where a secret must not reach the browser, content must be validated server-side, or a cross-origin resource must be fetched — `file-upload`, `image-proxy`. Everything arriving is hostile until allowlist-validated.

**Never:** a pass-through proxy for a call `api/` could make itself.

### L7 — API transport · `frontend-api-layer` · `/frontend-api`

`api-constants.ts` returns path-only URL builders (`as const`, always functions). `<domain>-api.ts` has one exported async function per HTTP call, returning `Promise<ApiResponse<T>>`, checking `!response.ok || !result.success`, throwing `createApiError(message, status)`.

**Never:** business logic, transformation, toast, validation, a local `createErrorWithStatus`, a bespoke response type, or `NEXT_PUBLIC_API_URL` in a builder.

### L6 — Services · `frontend-services` · `/frontend-service`

Standalone exported async functions. Zod `.parse()`, wire→domain mapping, query-string assembly, SSR reads via `fetchWithCookiesServer`, multi-step orchestration. `wrapZodError` converts `ZodError` and re-throws everything else **unchanged** — wrapping strips `.status` and breaks 422 formatting.

**Never:** `sonner`, React, a raw backend `fetch`, or `response.data?.field` without narrowing.

### L5 — Handlers · `frontend-handlers` · `/frontend-handler`

The toast boundary — the only place `sonner` is imported. `handle<Action><Entity>` in `<area>.handlers.ts`, grouped by UI area. Success copy from `result.message`; catch does `handleErrorToast(error, fallback)` **and** `throw error`.

**Never:** an `api/` import, business logic, a self-built pluralized message, or a read handler (a read handler toasts on page load).

### L4 — Hooks · `frontend-hooks` · `/frontend-hook`

Four kinds in **two** locations. `components/(table)/use<Entity>Table.ts` is **co-located** and calls **handlers** (its operations are mutations) and `router.refresh()` on success. Top-level `hooks/` holds React Query reads (exported query key containing every result-affecting param), URL param readers, and race-guarded async checks — those call the **service** directly, because reads have no toast boundary.

**Never:** `sonner`, a direct `api/` or `fetch` call, filter state in `useState`, an unconditional `refetchInterval`, a table-state hook in top-level `hooks/`, or a mutation without `router.refresh()` in the SSR pattern.

### L3 — Section context · `frontend-section-context`

Only when sibling components share state props cannot carry — canonically a selection shared by a bulk bar and a table. Co-located with its section. Owns selection and derived eligibility; consumer hook throws outside its provider.

**Never:** filters or pagination (those live in the URL), and never a direct service or `api/` call.

### L2 — Components · `frontend-components` · `/frontend-component`

Two canonical shapes — SSR list page (`Presenter.tsx` + `(header)/` + `(filter)/` + `(table)/`) and React Query live table. Presenters own layout and, in the SSR shape, the read. One component per file. One action, one file — row and bulk are the same component, with **`isBulk` as an explicit prop**, never derived from `ids.length > 1`. `tableState` crosses the client boundary as one object prop. Dialogs are controlled, presentational, and `next/dynamic`. Shared table primitives come from `@repo/ui/components/common/table`; test IDs from `utils/testids.ts`.

**Never:** a service/API/`fetch` call, `sonner`, a purely-forwarded prop, an inline sub-component, or an ownership check.

### L1 — Route entry · `frontend-route-entry` · `/frontend-page`

`app/` is routing only. Private pages are Server Components exporting `metadata`. Hybrid pages `await params`, `notFound()` on invalid ones, and branch owner vs. visitor — the only place ownership is decided. Providers go in `layout.tsx`. `<Suspense>` wraps every `useSearchParams` consumer, in the file that actually contains it.

**Never:** feature code in `app/`, a relative `../` import, `'use client'`, or a `fetch`.

---

## Workflow

### A new feature, end to end

```
/frontend-plan-feature        pattern (4A/4B/4C), layers needed, endpoint→layer map, build order
        ↓
/frontend-scaffold-module     folders + compiling stubs; registers in module-directory
        ↓
/frontend-contract            schemas/types in packages/  →  gate: schemas-types build
        ↓
/frontend-api                 api-constants.ts + <feature>-api.ts
        ↓
/frontend-service             validation, mapping, orchestration
        ↓
/frontend-handler             mutations only — toast + re-throw
        ↓
/frontend-hook                client reads, URL params, async checks
        ↓
/frontend-component           presenter → sections → rows → actions → dialogs
        ↓
/frontend-page                page.tsx (+ layout.tsx, + Suspense)
        ↓
/frontend-test                Jest, per layer
        ↓
/frontend-audit               layer + anti-pattern audit
        ↓
/frontend-verify              lint · check-types · build · test · manual gate
```

`/frontend-feature` runs L0 → L1 in one pass with a gate after each layer, for a single coherent slice.

### Adding one endpoint to an existing module

```
/frontend-contract (if the shape is new) → /frontend-api → /frontend-service
   → /frontend-handler (mutation) or /frontend-hook (read) → /frontend-component
   → /frontend-test → /frontend-verify
```

### Changing an existing module

```
/frontend-audit <module>        find what already drifts
   → make the change with the relevant layer skill loaded
   → /frontend-test → /frontend-verify → /review-impact-frontend
```

### Before merge

```
/frontend-audit  →  /frontend-verify  →  /review-impact-frontend  →  frontend-reviewer agent  →  /commit
```

---

## Command reference

| Command | Purpose | Prerequisite |
|---|---|---|
| `/frontend-plan-feature` | Pick the pattern, decide layers, emit the build order | Route and endpoint set roughly known |
| `/frontend-scaffold-module` | Create layer folders + compiling stubs | Pattern chosen |
| `/frontend-contract` | Add/change a shared schema, response type, or constant | Field rules and messages decided |
| `/frontend-api` | Endpoint builder + HTTP function | Payload/response types exist |
| `/frontend-service` | Validation, mapping, orchestration, SSR read | `api/` function exists |
| `/frontend-handler` | Mutation entry point with toast + re-throw | Service function exists |
| `/frontend-hook` | React Query read, URL params, or async check | Service function exists |
| `/frontend-component` | Presenter, section, row, action, dialog, form | Handler or hook exists |
| `/frontend-page` | Route entry, layout, Suspense | Components exist |
| `/frontend-feature` | Full vertical slice, L0 → L1, gated per layer | Endpoint contracts known |
| `/frontend-audit` | Layer, toast, contract, and anti-pattern audit | Code exists |
| `/frontend-test` | Jest + RTL tests, per layer | Code exists |
| `/frontend-verify` | Full gate: build, lint, types, Next build, tests, manual checks | Change complete |
| `/review-impact-frontend` | Blast radius of changed files *(existing)* | Files changed on the branch |
| `/commit` | Conventional commit message *(existing)* | Changes staged |

The `frontend-reviewer` agent gives an independent read on React/Next boundaries, accessibility, and performance — invoke it before merge, alongside `/frontend-audit`.

---

## Verification gate

```bash
pnpm --filter @repo/schemas-types build     # only if packages/ changed
pnpm --filter frontend lint
pnpm --filter frontend check-types
pnpm --filter frontend build                # the ONLY step that catches a missing Suspense boundary
pnpm --filter frontend test
```

`lint` + `check-types` after any change. `build` before calling work done.

---

## Known doc drift

These skills and commands follow **`module-architecture-and-layers.instructions.md`** and the real code where the older docs disagree:

| Older doc says | Reality (verified against the code) |
|---|---|
| `types/domain.ts` / `validations/schemas.ts` re-export from `@repo/schemas-types` | They hold local code only; re-exporting is an anti-pattern |
| `createErrorWithStatus` | The export is `createApiError`, from `@repo/utilities/errors/error-parsing`. There is no local `createErrorWithStatus` left anywhere in the repo — the legacy `features/` tree that used to carry it was removed |
| Layer folders are underscore-prefixed (`_api/`) | All of `modules/` uses `api/`, `services/`, `handlers/` — no underscore prefix. The underscore-prefixed shape belonged to the legacy `features/` tree, which no longer exists |
| `api-constants.ts` prefixes `NEXT_PUBLIC_API_URL` | Builders return path-only strings; the fetch helper prefixes |
| Auth handlers throw `AuthApiError`, forms call `parseSignInError` | **Neither symbol exists anywhere in the repo.** `modules/auth/handlers/sign-in.handlers.ts` toasts via `handleErrorToast` like any other handler. Treat `AuthApiError` as a target design that must be built before it can be used |
| `module-directory.md` | The file is `module-directory.instructions.md` |

### One tree

Everything lives under `apps/frontend/modules/` — currently `auth/` and `common/`. There is
no legacy `features/` tree in this template; everything new goes in `modules/`.

`app/layout.tsx` importing `sonner` for the `<Toaster />` mount is correct, not a toast-boundary violation.
