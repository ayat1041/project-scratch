---
description: "Serial index of the admin skills and slash commands, one per architecture layer from the route entry down to the API. apps/admin mirrors apps/frontend layer for layer — same canonical module patterns, same rules, different paths."
applyTo: "apps/admin/**"
---

# Admin Commands & Skills — Layer by Layer

> **Scope:** `apps/admin`. Frontend equivalent: `apps/frontend/instructions/frontend-commands-and-skills.instructions.md`. Cross-surface map: `.github/instructions/commands-and-skills-map.instructions.md`.

Skills live in `.claude/skills/<name>/SKILL.md`; commands in `.claude/commands/<name>.md`, invoked as `/<name>`.

---

## The layer stack (UI → API)

Read top-down; **build bottom-up**.

| # | Layer | Path | Skill | Command |
|---|---|---|---|---|
| L0 | Shared contracts | `packages/schemas-types`, `packages/constants` | `monorepo-contracts`, `frontend-contracts` | `/frontend-contract`, `/monorepo-contract-change` |
| A1 | Route entry | `app/dashboard/<area>/page.tsx` | `admin-route-entry` | `/admin-page` |
| A2 | Components | `modules/<domain>/<module>/components/` | `admin-components` | `/admin-component` |
| A3 | Section context | `components/(<entity>)/<Entity>SectionContext.tsx` | `admin-section-context` | `/admin-component` |
| A4 | Hooks | `components/(table)/use<Entity>Table.ts`, `hooks/` | `admin-hooks` | `/admin-component` |
| A5 | Handlers | `modules/<domain>/<module>/handlers/` | `admin-handlers` | `/admin-handler` |
| A6 | Services | `modules/<domain>/<module>/services/` | `admin-services` | `/admin-service` |
| A7 | API transport | `modules/<domain>/<module>/api/` | `admin-api-layer` | `/admin-api` |
| A8 | Next.js route handlers | `app/api/<name>/route.ts` | `admin-route-handlers` | *(hand-written)* |

Cross-cutting: `admin-error-handling`, `admin-testids-and-testing` (`/admin-test`). Shared with the frontend rather than duplicated: `frontend-contracts` (L0) and `frontend-naming`. Orientation: `admin-architecture` (`/admin-plan-feature`).

---

## The two paths

```
MUTATE   Client component → Handler → Service → API → backend
READ     Server Presenter → Service → API → backend        ← the SSR-read exception
```

**The SSR-read exception.** A Server Component `Presenter.tsx` may call the service **directly**. That is the sanctioned read path, not a violation — the "never call a service directly" rule targets Client Components and every write flow.

There is **no read handler** in admin. A read handler would toast during a page render.

---

## Same app shape as `apps/frontend`

`apps/admin` and `apps/frontend` are the same stack and follow **one** set of conventions.
The skill sets mirror each other layer for layer; only the paths differ.

The **two canonical module patterns are shared by both apps** — load the matching pattern
skill before building anything:

| Need | Pattern skill | Admin reference | Frontend reference |
|---|---|---|---|
| Searchable/filterable table, fresh on navigation | `nextjs-list-page-pattern` | none yet — `modules/` currently holds only `auth/` and `common/` | none yet — `modules/` currently holds only `auth/` and `common/` |
| Live data, polling, optimistic rows, shared selection | `nextjs-live-table-pattern` | none yet | none yet |

No module in `apps/admin` or `apps/frontend` currently follows the canonical table
shape end to end — the first table-backed module you build in either app (e.g. `users`
in admin, a hypothetical `user-management/api-keys` list in frontend) should. See the
`nextjs-list-page-pattern` / `nextjs-live-table-pattern` skills for the worked-example
shape: same `Presenter.tsx`, same co-located `use<Entity>Table.ts`, same
`router.refresh()`, same `<Entity>Dialogs.tsx`.

## Per layer — what governs it and what it must never do

### A7 — API transport · `admin-api-layer` · `/admin-api`
`api-constants.ts` returns path-only builders. One async function per call, `createApiError` on failure, checking `!response.ok || !data.success`. Picks `fetchWithCookiesServer` for Presenter-reached reads, `fetchWithCookies` for handler-reached mutations — a module's `api/` file commonly imports both.
**Never:** a local `createErrorWithStatus`, a bespoke response type, transformation, toast, or `NEXT_PUBLIC_API_URL` in a builder.

### A5 — Services · `admin-services` · `/admin-service`
Takes the `searchParams` Promise, normalizes through one `first()` helper, calls the API, maps wire → domain via `_`-prefixed private transformers, and returns exactly the shape the Presenter destructures.
**Never:** swallow a failure into an empty result, return a raw wire shape, duplicate status mapping that belongs in `constants/`, import `sonner` or React, or re-wrap non-Zod errors.

### A4 — Handlers · `admin-handlers` · `/admin-handler`
The toast boundary — the only place `sonner` is imported, aside from the `<Toaster />` mount in `app/layout.tsx`. `toast.success(result.message || fallback)`, then `handleErrorToast` **and** `throw error`.
**Never:** swallow the error, import `api/`, build count-dependent copy, or hold a confirmation dialog (that is the component's job).

### A4 — Hooks · `admin-hooks` · `/admin-component`
`components/(table)/use<Entity>Table.ts` — **co-located**, not in top-level `hooks/`. Owns selection, dialog and loading state, calls **handlers**, returns `boolean` per mutation, and calls `router.refresh()` on success. Shared dialog wiring reused by a sibling detail page is extracted **once** into the parent module's `hooks/`.
**Never:** a direct service or `api/` call, `sonner`, mirroring `searchParams`, or skipping `router.refresh()` after a mutation.

### A3 — Section context · `admin-section-context` · `/admin-component`
Only when **sibling** components share a selection that one Client boundary cannot own. Co-located with its section; consumer hook throws outside its provider.
**Never:** filters or pagination (URL state), a direct service or `api/` call, or a provider for state the table-state hook already owns.

### A2 — Components · `admin-components` · `/admin-component`
`Presenter.tsx` (async Server Component) does the SSR read and layout. `(header)/index.tsx` holds title + primary action. `(filter)/index.tsx` builds `FilterField[]` from server counts. `(table)/index.tsx` is the Client boundary and passes `tableState` as **one** object prop to the table and `<Entity>Dialogs.tsx`. Rows stay directive-free unless they wire their own handlers.
**Never:** `'use client'` on the Presenter, a needless directive on rows, a static dialog import, twenty hook fields destructured across the client hop, a role check in a leaf, or a third table shape invented for one screen.

### A8 — Route handlers · `admin-route-handlers`
`app/api/*/route.ts` — only where a secret must not reach the browser, content needs server-side validation, or a cross-origin fetch is required.
**Never:** a pass-through proxy for a call `api/` could make itself.

### A1 — Route entry · `admin-route-entry` · `/admin-page`
A thin Server Component: `metadata`, forward `searchParams`, render the Presenter. Role branching here or in middleware.
**Never:** fetch, hold state, use `'use client'`, or import module code with a relative path.

---

## Workflow

### A new module, end to end

```
/admin-plan-feature        layers, Client boundary, endpoint→layer map, build order
        ↓
/frontend-contract         schemas/types in packages/   → GATE: schemas-types build
        ↓
/admin-scaffold-module     folders + compiling stubs
        ↓
/admin-api                 api-constants.ts + <module>-api.ts
        ↓
/admin-service             searchParams normalization, transformers, mutations
        ↓
/admin-handler             mutations only — toast + re-throw
        ↓
/admin-component           Presenter → (filter) → (table) → rows → dialogs
        ↓
/admin-page                route entry
        ↓
/admin-test  →  /admin-audit  →  /admin-verify
```

### Adding one action to an existing module

```
/frontend-contract (if the shape is new) → /admin-api → /admin-service
   → /admin-handler → /admin-component → /admin-test → /admin-verify
```

### Before merge

```
/admin-audit → /admin-verify → /review-impact-admin → admin-reviewer agent → /commit
```

---

## Command reference

| Command | Purpose | Prerequisite |
|---|---|---|
| `/admin-plan-feature` | Decide layers, place the Client boundary, emit the build order | Route and endpoint set roughly known |
| `/admin-scaffold-module` | Layer folders + compiling stubs | Plan settled |
| `/admin-api` | Endpoint builder + HTTP function | Payload/response types exist |
| `/admin-service` | SSR read, transformers, mutations | `api/` function exists |
| `/admin-handler` | Mutation entry point with toast + re-throw | Service function exists |
| `/admin-component` | Presenter, filter, table, row, dialog, co-located table-state hook | Handler or service exists |
| `/admin-page` | Route entry, role guard, provider | Presenter exists |
| `/admin-audit` | Layer, Client-boundary, and anti-pattern audit | Code exists |
| `/admin-test` | Jest + RTL tests, per layer | Code exists |
| `/admin-verify` | Full gate: build, lint, types, Next build, tests, manual checks | Change complete |
| `/review-impact-admin` | Blast radius of changed files *(existing)* | Files changed on the branch |
| `/commit` | Conventional commit message *(existing)* | Changes staged |

The `admin-reviewer` agent gives an independent read on accessibility and UX — invoke it before merge alongside `/admin-audit`.

---

## Verification gate

```bash
pnpm --filter @repo/schemas-types build     # only if packages/ changed
pnpm --filter admin lint
pnpm --filter admin check-types
pnpm --filter admin build                   # catches missing <Suspense> AND server-only imports on client paths
pnpm --filter admin test
```

`lint` + `check-types` after any change; `build` before calling work done. If `packages/` changed, also run `pnpm --filter frontend check-types` and `pnpm --filter backend build`.

---

## Known doc drift — verified against the code

| `admin-agents.instructions.md` says | Reality |
|---|---|
| `api/` throws `createErrorWithStatus` | The real export is **`createApiError`** from `@repo/utilities/errors/error-parsing`; `createErrorWithStatus` appears nowhere in `apps/admin` |
| `types/domain.ts` re-exports from `@repo/schemas-types` | It holds **local** types and composite DTOs; import package types directly at the call site, canonical name, no alias |
| Shared contracts in `packages/types` / `packages/validations` | Neither package exists. Use `@repo/schemas-types` and `@repo/constants` |

`app/layout.tsx` importing `sonner` for the `<Toaster />` mount is correct, not a toast-boundary violation.

Admin test coverage is currently thin (`__tests__/page.test.tsx` only) — new tests establish the pattern rather than follow a deep precedent.
