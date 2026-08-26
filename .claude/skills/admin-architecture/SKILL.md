---
name: admin-architecture
description: Entry point and router for any work inside apps/admin. Use before creating a module, adding a layer, or deciding where code belongs. apps/admin and apps/frontend are the same stack and follow the same two canonical module patterns — this resolves the layer stack, points to the per-layer skill, and names the modules that have drifted.
---

# Admin Architecture — Orientation

Scope: `apps/admin` — Next.js 15, React 19, TypeScript, port 4000. Module code lives in `modules/`; `app/` holds routing only.

## Same stack, same rules as `apps/frontend`

`apps/admin` and `apps/frontend` are the same kind of app and follow **one** set of conventions. Everything below matches `frontend-architecture` layer for layer; only the paths differ.

**The two canonical module patterns are shared by both apps.** Load the matching skill before building anything:

| Need | Pattern skill | Reference in **admin** | Reference in **frontend** |
|---|---|---|---|
| Searchable/filterable table, data fresh on navigation | **`nextjs-list-page-pattern`** | *(none yet — see the pattern skill)* | *(none yet — see the pattern skill)* |
| Live data, polling, optimistic rows, siblings sharing a selection | **`nextjs-live-table-pattern`** | *(none yet — see the pattern skill)* | *(none yet — see the pattern skill)* |

Default to the list-page pattern. Reach for the live-table pattern when data genuinely changes under the user; nothing in admin needs it yet, but the pattern is identical when it does — do not invent a third shape.

## The layer stack (UI → API)

Read top-down; **build bottom-up**.

| # | Layer | Path | Skill |
|---|---|---|---|
| L0 | Shared contracts | `packages/schemas-types`, `packages/constants` | `frontend-contracts` *(shared by both apps)* |
| A1 | Route entry | `app/dashboard/<area>/page.tsx`, `layout.tsx` | `admin-route-entry` |
| A2 | Components | `modules/<domain>/<module>/components/` | `admin-components` |
| A3 | Section context | `components/(<entity>)/<Entity>SectionContext.tsx` | `admin-section-context` |
| A4 | Hooks | `components/(table)/use<Entity>Table.ts`, `hooks/` | `admin-hooks` |
| A5 | Handlers | `modules/<domain>/<module>/handlers/` | `admin-handlers` |
| A6 | Services | `modules/<domain>/<module>/services/` | `admin-services` |
| A7 | API transport | `modules/<domain>/<module>/api/` | `admin-api-layer` |
| A8 | Next.js route handlers | `app/api/<name>/route.ts` | `admin-route-handlers` |

Cross-cutting: `admin-error-handling`, `admin-testids-and-testing`, plus `frontend-naming` and `frontend-contracts`, which are shared by both apps rather than duplicated.

## The paths through the stack

```
MUTATE   Client component / table-state hook → Handler → Service → API → backend
READ     Server Presenter → Service → API → backend
```

**The SSR-read exception.** An async Server Component `Presenter.tsx` may call the service **directly**. That is the sanctioned read path, not a layer violation — the "components never call services" rule targets Client Components and every mutation.

There is **no read handler**: a handler exists to toast, and a page render must not toast.

## Folder shape

```
modules/<domain>/<module>/
├── api/            api-constants.ts + <module>-api.ts
├── services/       <module>-service.ts
├── handlers/       <area>.handlers.ts
├── types/          domain.ts
├── constants/      <module>.constants.ts
├── utils/          helpers.ts, testids.ts
└── components/
    ├── Presenter.tsx              async Server Component — the read entry point
    ├── (header)/index.tsx
    ├── (filter)/index.tsx
    └── (table)/
        ├── index.tsx              'use client' — the Client boundary
        ├── use<Entity>Table.ts    ← table-state hook, CO-LOCATED
        ├── <Entity>Table.tsx
        └── <Entity>Dialogs.tsx
```

Modules today: `auth/`, `common/`. The real CRUD surface admin is built for — `user-management/roles/`, `user-management/permissions/` — has a route stub (`app/dashboard/roles-and-permissions/`) but no module yet; treat `user-management/{roles,permissions}` as the target shape for the next one built. A module can grow its own nested sub-module — e.g. a `bulk-import/` flow — with its own full stack and its own `architecture.md`, the same shape as the top level.

## Dependency rules

```
ALLOWED
  Client component  → Handler → Service → API
  Server Presenter  → Service → API                  (SSR read only)
  Table-state hook  → Handler → Service → API
  Component         → Section context → Hook
  Any layer         → types/domain.ts, utils/, @repo/*

FORBIDDEN
  Client component → Service or API      skip layers
  Handler          → API                 skips service validation
  Service          → Component or Hook   upward dependency
  utils/           → any module layer
  Module A         → Module B's internals via relative ../
```

## Non-negotiables

- **Toast rule** — `sonner` only in `handlers/`. The sole exception is the `<Toaster />` mount in `app/layout.tsx`.
- **Server default** — no `'use client'` unless the file itself needs state, effects, event handlers, browser APIs, or context. A descendant of a Client Component does **not** redeclare the directive.
- **URL-state rule** — filters, search, sort, pagination live in the URL, written by the shared `Filter` / `Pagination` from `@repo/ui`, and read **server-side** by the Presenter. Never mirrored into client state.
- **Suspense rule** — any client component reading `useSearchParams` must render under `<Suspense>`, or `next build` fails with `missing-suspense-with-csr-bailout`. A provider mounted in `layout.tsx` needs its own boundary there.
- **Dynamic dialogs** — every modal not needed for first paint uses `next/dynamic`.
- **Shared contracts** — payload schemas, response types, entity types from `@repo/schemas-types`; runtime enums from `@repo/constants`; UI from `@repo/ui`; error helpers from `@repo/utilities`.
- **Shared table primitives** — `Filter`, `Pagination`, `Empty`, `BulkActionBar`, `TableHeaderRow`, `TableSkeleton`, `TableTitle` from `@repo/ui/components/common/table`. No per-module equivalents.
- **Import alias** — `@modules/*` from `app/` and across modules; relative only inside one module.
- **Authorization** — role/permission branching at `page.tsx` or `middleware.ts`, never in a leaf component.

## Modules that have drifted — converge, do not copy

`modules/user-management/roles/` and `modules/user-management/permissions/` are the **canonical** shape once built — layer for layer the same as the frontend reference, down to the co-located `use<Entity>Table.ts` and `router.refresh()`.

Watch for a module built before that shape solidifies — for example, an early `user-management/api-keys/` *(hypothetical)*. Treat drift like this as debt, not precedent:

| Deviation | Canonical |
|---|---|
| Table-state hook in top-level `hooks/useApiKeysTableState.ts` | Co-locate at `components/(table)/useApiKeysTable.ts` |
| Dialogs in `components/dialogs/` | `components/(table)/<Entity>Dialogs.tsx`, one component driven by `tableState` |
| `(table)/index.tsx` destructures ~20 hook fields individually | Pass the whole `tableState` as one object prop |
| No `utils/testids.ts` | Every module has one; testids are never inlined |
| No `(header)/index.tsx` | Title + primary action live there |

When you touch a module like this, move it toward the canonical shape. Do not replicate its structure in a new module.

## Commands

```bash
pnpm --filter admin dev            # port 4000
pnpm --filter admin lint
pnpm --filter admin check-types
pnpm --filter admin build
pnpm --filter admin test
```

`lint` + `check-types` after any change; `build` before calling work done — it is the only step that catches a missing Suspense boundary or a server-only import on a client path.

## Source-of-truth docs

- `apps/admin/instructions/admin-agents.instructions.md`
- `apps/admin/instructions/admin-commands-and-skills.instructions.md`
- See the `nextjs-live-table-pattern` skill for the full live-table contract — no reference implementation exists in either app yet.

## Known doc drift — verified against the code

- `admin-agents.instructions.md` says the `api/` layer throws `createErrorWithStatus`. The real export is **`createApiError`** from `@repo/utilities/error-handling`; `createErrorWithStatus` appears nowhere in `apps/admin`.
- It says `types/domain.ts` re-exports from `@repo/schemas-types`. It does not — that file holds **local** types and composite DTOs. Import package types directly at the call site under their canonical names.
- Shared-package wording pointing at `packages/types` / `packages/validations`: neither exists. Use `@repo/schemas-types` and `@repo/constants`.
- Two `admin-agents.instructions.md` files exist — a 38-line stub in `.github/instructions/` and the 415-line authoritative one in `apps/admin/instructions/`. Prefer the app-local file.
