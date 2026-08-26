---
description: Add a component or table-state hook to an admin module (A2/A3) — Presenter, filter zone, table, row, action, or dialog — with the Client boundary in the right place.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Admin Component / Hook (A2, A3)

## Step 1 — Pick the role

| Role | Location | Directive |
|---|---|---|
| Presenter | `components/Presenter.tsx` | **Server** — never `'use client'` |
| Header zone | `components/(header)/index.tsx` | Server, unless it wires its own handlers |
| Filter zone | `components/(filter)/index.tsx` | **Client** — it renders the interactive shared `Filter` |
| Table | `components/(table)/index.tsx` | **Client** — the boundary |
| Table header / content / row | `components/(table)/<Entity>*.tsx` | none, unless it wires its own handlers |
| Dialogs | `components/(table)/<Entity>Dialogs.tsx` — one component driven by `tableState` | Client, dynamically imported |
| Table-state hook | `components/(table)/use<Entity>Table.ts` — **co-located** | — |

## Step 2 — Gather inputs

- Target module, role, component name
- Data source: the Presenter's service call, or props
- Mutations it triggers: which handler(s)
- Does it need client-only APIs of its own?

## Step 3 — Required reading

- Skill `admin-components`
- Skill `nextjs-list-page-pattern` — the full contract for this shape
- Skill `admin-error-handling` (if it submits or mutates)
- The module's `utils/testids.ts`
- `modules/user-management/permissions/components/` — the canonical reference

## Step 4a — Presenter (Server Component)

```typescript
export default async function PermissionPresenter({ searchParams }: Props) {
  const data = await getAllPermissions(searchParams);

  const pagination = data.pagination;
  const rows = data.data;
  const counts = data.counts;

  return (
    <>
      <FilterSection counts={counts} />
      <TableSection data={rows} />
      <PaginationSection pagination={pagination} length={!!rows.length} />
      <EmptySection
        length={rows.length}
        searchParams={searchParams}
        emptyMessage="No permissions added yet."
        filteredMessage="No permissions match your filters."
      />
    </>
  );
}
```

Calls the service directly — the sanctioned SSR-read exception. Owns the read and layout, nothing else: no selection state, no dialog state, no business logic. Use `EmptySection`, `PaginationSection`, and `Filter` from `@repo/ui/components/common/table` rather than per-module equivalents, and give `EmptySection` **distinct** empty and filtered messages.

## Step 4b — Table (Client boundary)

`'use client'` goes here. It calls the co-located `use<Entity>Table(data)` and passes the result as **one `tableState` prop** to `<Entity>Table.tsx` and `<Entity>Dialogs.tsx`. It builds the `bulkActions` config for the shared `BulkActionBar`, clearing the selection only when the mutation returns `true`. Mutations go through handlers.

## Step 4c — Rows and content

Pure and prop-driven, **no directive** — being inside a Client subtree does not require redeclaring it. Add `'use client'` only when the file itself calls `useState`/`useEffect` or wires its own `onClick` (see `PermissionRow.tsx`).

## Step 4d — Hooks

The table-state hook is **co-located** at `components/(table)/use<Entity>Table.ts`. It owns selection (`Set<string>`), loading flags, and one `<entity, open>` pair per dialog; it calls **handlers**, returns `boolean` per mutation, and calls `router.refresh()` on success — that is what re-runs the Server Component read.

`user-management/roles` keeps its hook in a top-level `hooks/` — that is the outlier, not the pattern.

Do not mirror `searchParams` into state; the Presenter already read them server-side. Admin has no React Query today; if a screen genuinely needs live data, use the shared contract in `nextjs-live-table-pattern` rather than inventing one.

When dialog wiring is shared with a sibling detail/review page, extract **one** hook into the parent module's `hooks/` (as `useRoleDetailActionDialogs` does) rather than reimplementing it per consumer.

## Step 5 — Rules

- **One component per file.** A named, multi-line function with its own props interface returning JSX gets its own file.
- No purely-forwarded props. The client hop at `(table)/index.tsx` is structurally necessary — but bundle unrelated forwarded fields into one object prop (`reviewFlags`, `rowActions`) rather than naming each.
- Never import `sonner`. Mutations go through a handler.
- Dialogs are dynamically imported, controlled, presentational — `open`/`onOpenChange` in, callbacks out.
- Destructive actions render a confirm dialog before calling the handler.
- Role-sensitive actions are hidden or disabled per the permission model; the branch itself belongs at `page.tsx` or middleware.
- Forms: RHF + `zodResolver` with the schema **VALUE** from `@repo/schemas-types` (plain `import` — `import type` compiles then throws at runtime).

## Step 6 — Test IDs

Add every new `data-testid` to `utils/testids.ts` first as an `as const` group, then reference the constant. Row-level ids use a `_PREFIX` constant plus the row id. Never inline a raw string.

## Step 7 — Verify

```bash
pnpm --filter admin lint
pnpm --filter admin check-types
pnpm --filter admin build
```

## Step 8 — Report

- Component, path, role, and whether it carries `'use client'` — with the reason.
- Handler or service it talks to.
- Test IDs added.
- Next: `/admin-page`, or `/admin-test`.
