---
description: Scaffold an admin module under apps/admin/modules with the correct layer folders, Presenter, filter and table zones, and compiling stubs.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
---

# Scaffold Admin Module

## Step 1 — Gather inputs

- Domain and module name (kebab-case)
- Entity name in PascalCase (drives file and symbol names)
- Does it mutate? (decides `handlers/`)
- Does the table have dialogs, expansion, or selection? (decides `hooks/`)
- Is there a detail/review sub-module?

Take answers from `/admin-plan-feature` if it ran.

## Step 2 — Required reading

- Skill `admin-architecture`
- Skill `admin-components`
- `modules/user-management/permissions/` as the shape to mirror — the canonical module
- Skill `nextjs-list-page-pattern` for the full contract

## Step 3 — Refuse to duplicate

Check `apps/admin/modules/<domain>/`. If the module exists, stop and report where.

## Step 4 — Create the folders

Mirror `modules/user-management/permissions/` — it is already the canonical shape, following
the same list-page pattern `apps/frontend` uses for its own table modules (see skill
`nextjs-list-page-pattern`).

```
modules/<domain>/<module>/
├── api/api-constants.ts
├── api/<module>-api.ts
├── services/<module>-service.ts
├── handlers/<module>.handlers.ts          omit if read-only
├── types/domain.ts
├── constants/<module>.constants.ts
├── utils/helpers.ts
├── utils/testids.ts
└── components/
    ├── Presenter.tsx                       async Server Component — SSR read
    ├── (header)/index.tsx                  title + primary action
    ├── (filter)/index.tsx                  'use client' — FilterField[] from counts
    └── (table)/
        ├── index.tsx                       'use client' — the Client boundary
        ├── use<Entity>Table.ts             ← table-state hook, CO-LOCATED
        ├── <Entity>Table.tsx
        ├── <Entity>TableHeader.tsx
        └── <Entity>Dialogs.tsx             all dialogs, driven by tableState
```

**Do not** put the table-state hook in a top-level `hooks/` — `user-management/roles/` does
that and is the outlier, not the pattern. A top-level `hooks/` is only for a dialog hook
genuinely shared with a sibling detail page.

Add a `review/` sub-module with its own `api/`, `services/`, `handlers/`, `components/`, `types/` only when a detail page needs its own stack.

## Step 5 — Stub contents

Every file compiles — no empty files:

- `api-constants.ts` — `as const` `<MODULE>_API` object with path-only builders.
- `<module>-api.ts` — imports `fetchWithCookies`, `fetchWithCookiesServer`, `createApiError`; one exported async function per planned endpoint, body `throw new Error('Not implemented');`.
- `<module>-service.ts` — `import * as api from '../api/<module>-api';`, a `first()` searchParams helper, a `get<Entities>(searchParams)` returning the shape the Presenter destructures, and a `// ---- Private transformers ----` banner.
- `<module>.handlers.ts` — `import { toast } from 'sonner';` + `handleErrorToast`, one `handle<Action><Entity>` per mutation with the full try/toast/catch/re-throw skeleton.
- `Presenter.tsx` — `async` Server Component, awaits the service, destructures `pagination` / `data` / `counts`, composes `(filter)`, `(table)`, `PaginationSection`, `EmptySection` from `@repo/ui/components/common/table` with **distinct** `emptyMessage` and `filteredMessage`.
- `(table)/index.tsx` — `'use client'`, calls `use<Entity>Table(data)` and passes `tableState` as **one** object prop to the table and the dialogs.
- `(table)/use<Entity>Table.ts` — selection `Set<string>`, loading flags, one `<entity, open>` pair per dialog, handlers calling the module's handlers, `router.refresh()` on success, returning `boolean` per mutation.
- Row components — no directive unless they wire their own handlers.
- `utils/testids.ts` — one `as const` group per zone.

**Do not put `'use client'` on `Presenter.tsx`.** `(filter)/index.tsx` does carry it — it renders the interactive shared `Filter`.

## Step 6 — Verify

```bash
pnpm --filter admin lint
pnpm --filter admin check-types
```

## Step 7 — Report

- Files created, grouped by layer.
- Which file carries the Client boundary.
- Layers deliberately omitted, and why.
- Next: `/frontend-contract` if contracts are missing, then `/admin-api`.
