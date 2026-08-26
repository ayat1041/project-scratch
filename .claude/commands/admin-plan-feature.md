---
description: Plan an admin panel module before any file is created — decide the layers, map backend endpoints to them, and emit the exact bottom-up build order.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Plan Admin Module

Produces a build plan. Creates no files. Run before `/admin-scaffold-module`.

## Step 1 — Gather inputs

Confirm (ask if missing, do not guess):

- Domain and module name (kebab-case), e.g. `user-management/api-keys`
- Dashboard route it lives at
- Primary UI: filterable table? detail/review sub-page? both?
- Backend endpoints available — method, path, request, response
- Which roles or permissions may see it, and which may act on it
- Are there destructive actions (approve, reject, suspend)?

## Step 2 — Required reading

- Skill `admin-architecture`
- Skill `nextjs-list-page-pattern` (or `nextjs-live-table-pattern` if the data is live)
- `apps/admin/instructions/admin-agents.instructions.md`
- `modules/user-management/permissions/` — the canonical module. `modules/user-management/roles/` predates it and deviates; use it only as the reference for a *detail sub-module*, not for module shape.

## Step 3 — Pick the module pattern

`apps/admin` and `apps/frontend` share **two** canonical patterns. Name the one you are using:

| Need | Pattern |
|---|---|
| Searchable/filterable table, fresh on navigation | `nextjs-list-page-pattern` — SSR Presenter + co-located `use<Entity>Table` + `router.refresh()` |
| Live/polling data, optimistic rows, siblings sharing a selection | `nextjs-live-table-pattern` — React Query + section context |

Default to the list-page pattern; nothing in admin needs the live one yet. If you believe it does, say why the data changes under the user — that is a real design decision, not a default. **Do not invent a third shape.**

## Step 4 — Decide the layers

State **needed / not needed** and why:

- `api/` — always
- `services/` — always
- `handlers/` — only if the module mutates
- `components/(table)/use<Entity>Table.ts` — the table-state hook, **co-located**, whenever the table has selection, dialogs, or expansion
- `hooks/` — only for a dialog hook genuinely shared with a sibling detail page
- `types/domain.ts` — local domain shapes the transformers produce
- `constants/` — status maps, display labels
- `utils/testids.ts` — always
- `components/` — `Presenter.tsx`, `(header)/`, `(filter)/`, `(table)/` with `<Entity>Table.tsx` + `<Entity>Dialogs.tsx`
- A `review/` (or equivalent) sub-module with its own full stack?

## Step 5 — Place the Client boundary

Name the exact file that carries `'use client'`. In this codebase that is `(table)/index.tsx`. Confirm:

- `Presenter.tsx` stays a Server Component
- `(filter)/index.tsx` carries `'use client'` — it renders the interactive shared `Filter`
- Row components carry no directive unless they wire their own handlers

A plan that puts `'use client'` at the Presenter has the boundary wrong.

## Step 6 — Map endpoints to layers

| Method + path | `api/` fn | service fn | handler fn | called from |
|---|---|---|---|---|

Reads end at the Presenter — **no handler**. Mutations end at a client component via a handler.

Note per `api/` function whether it needs `fetchWithCookiesServer` (Presenter-reached) or `fetchWithCookies` (handler-reached).

## Step 7 — Identify contract gaps

List every payload schema, response type, and shared constant that must exist in `@repo/schemas-types` / `@repo/constants` and does not. Note which are shared with `apps/backend` — an admin action almost always has a backend endpoint on the other side, and the contract is designed once for both.

## Step 8 — Report the build order

```
0. /frontend-contract   schemas/types in packages/  → schemas-types build
1. /admin-scaffold-module <domain>/<module>
2. /admin-api           api-constants.ts + <domain>-api.ts
3. /admin-service       searchParams normalization, transformers, mutations
4. /admin-handler       mutations only
5. /admin-component     Presenter → (filter) → (table) → rows → dialogs
6. /admin-page          route entry
7. /admin-test
8. /admin-audit
9. /admin-verify
```

Flag any open question that would change the plan — especially an unclear role/permission model — and stop for an answer rather than guessing who may act.
