---
name: nextjs-list-page-pattern
description: The canonical SSR list-page module shape shared by apps/frontend and apps/admin — Presenter, (header), (filter), (table)/index + use<Entity>Table, dialogs, and the @repo/ui table primitives. Use whenever building or reviewing a searchable/filterable/paginated table page in either app.
---

# Canonical List-Page Module (frontend **and** admin)

`apps/frontend` and `apps/admin` are the same stack and follow **one** module shape. This is it.

**Reference implementations — copy these, do not invent a variant:**

- `apps/admin/modules/roles/`
- `apps/admin/modules/permissions/`
- `apps/admin/modules/languages/`

`apps/frontend` has no list-page module in the current tree — the shape below is unchanged;
when frontend adds one (e.g. a hypothetical `user-management/api-keys` module), it follows
this exact structure.

An older module may predate these and deviate (table-state hook in a top-level `hooks/`,
dialogs in `components/dialogs/`, no `utils/testids.ts`, no `(header)/`). Converge such a
module when you touch it; do not use it as a reference.

For a table that needs live/polling data, use `nextjs-live-table-pattern` instead.

## Shape

```
modules/<domain>/<module>/
├── api/
│   ├── api-constants.ts               <MODULE>_ENDPOINTS — path-only URL builders
│   └── <module>-api.ts                one async function per HTTP call
├── services/
│   └── <module>-service.ts            getAll<Entities>(searchParams) + mutations
├── handlers/
│   └── <module>.handlers.ts           toast boundary
├── constants/
│   └── constants.ts                   status maps, display labels
├── utils/
│   ├── helpers.ts
│   └── testids.ts
├── validations/
│   └── <module>.schema.ts             form schemas ONLY (omit if backend owns validation)
└── components/
    ├── Presenter.tsx                  async Server Component — the read entry point
    ├── AddAndEdit<Entity>.tsx         the create/edit form dialog
    ├── (header)/index.tsx             title + primary action
    ├── (filter)/index.tsx             builds FilterField[] from server counts
    └── (table)/
        ├── index.tsx                  'use client' — TableSection
        ├── use<Entity>Table.ts        ← table state hook, CO-LOCATED here
        ├── <Entity>Table.tsx
        ├── <Entity>TableHeader.tsx
        └── <Entity>Dialogs.tsx        every dialog, driven by tableState
```

The table-state hook lives in **`(table)/use<Entity>Table.ts`**, beside the section it serves — not in a top-level `hooks/`. A top-level `hooks/` folder is for React Query and URL-param hooks (`nextjs-live-table-pattern`).

## `Presenter.tsx` — async Server Component

The read entry point. No `'use client'`.

```typescript
import { SearchParams } from '@/shared/types/search-params';
import { getAllRoles } from '../services/roles-service';
import FilterSection from './(filter)';
import TableSection from './(table)';
import PaginationSection from '@repo/ui/components/common/table/Pagination';
import EmptySection from '@repo/ui/components/common/table/Empty';

export default async function RolePresenter({ searchParams }: Props) {
  const data = await getAllRoles(searchParams);

  const pagination = data.pagination;
  const rolesData = data.data;
  const counts = data.counts;

  return (
    <>
      <FilterSection counts={counts} />
      <TableSection data={rolesData} />
      <PaginationSection pagination={pagination} length={!!data.data.length} />
      <EmptySection
        length={rolesData.length}
        searchParams={searchParams}
        emptyMessage="No roles added yet. Click the + button to add your first role."
        filteredMessage="No roles match your filters."
      />
    </>
  );
}
```

Calling the service directly from a Server Component **is** the sanctioned read path — it is not a layer violation. The "components never call services" rule targets Client Components and every mutation.

The Presenter owns layout and the read. Nothing else: no selection state, no dialog state, no business logic, no `try/catch`.

`EmptySection` takes **two distinct messages** — genuinely empty versus filtered-to-nothing. Always supply both; they are different user situations.

## `(filter)/index.tsx`

`'use client'`. Builds a `FilterField[]` from the **server-computed counts** and hands it to the shared `Filter`:

```typescript
'use client';
const fields: FilterField[] = [
  { type: 'search', key: 'search', placeholder: 'Search roles...', debounceMs: 800, testId: ROLE_FILTER.SEARCH_INPUT },
];

if (counts?.roleTypesCount?.length) {
  fields.push({
    type: 'select', key: 'type', placeholder: 'Role Type',
    options: counts.roleTypesCount,                    // { value, label, count } from the API
    defaultValue: counts.roleTypesCount[0]?.value,
    testId: ROLE_FILTER.ROLE_TYPE_TRIGGER,
  });
}
```

Options come straight from the backend's `counts` arrays — `label` is the API's, never a client-side copy. Push a filter only when its counts exist. Every field carries a `testId` from `utils/testids.ts`.

`Filter` writes back to the URL; the key change re-renders the Server Component and re-runs the read. No manual refetch wiring.

## `(table)/index.tsx` — the Client boundary

`'use client'`. Calls the co-located hook, builds the bulk-action config, renders the shared `BulkActionBar` plus the table and the dialogs.

```typescript
'use client';
export default function TableSection({ data }: TableSectionProps) {
  const tableState = useRoleTable(data);

  const bulkActions = [
    {
      label: 'Activate',
      icon: <Check className="mr-2 h-4 w-4" />,
      testId: ROLE_BULK_ACTIONS.ACTIVATE_BUTTON,
      onClick: async () => {
        const success = await tableState.handleActivateRoles([...tableState.selectedIds]);
        if (success) tableState.setSelectedIds(new Set());
      },
      loading: tableState.isActivating,
      disabled: tableState.isActivating,
    },
    { label: 'Delete', variant: 'destructive' as const, /* ... */ },
  ];

  return (
    <>
      <BulkActionBar selectedCount={tableState.selectedIds.size} actions={bulkActions} />
      <RoleTable data={data} tableState={tableState} />
      <RoleDialogs tableState={tableState} />
    </>
  );
}
```

**`tableState` is passed as one object prop.** This is deliberate: the hook returns a wide surface, and naming twenty fields individually across the table and dialog boundaries is exactly the prop-drilling this convention avoids.

A bulk action clears the selection **only on success** (`if (success) setSelectedIds(new Set())`) — which is why the hook's mutation handlers return a boolean.

## `(table)/use<Entity>Table.ts` — the table-state hook

Owns everything client-local for the section: selection, per-action loading flags, one open-state pair per dialog, and the mutation handlers.

```typescript
export function useRoleTable(data: RoleApiResponse[]) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const [editingRole, setEditingRole] = useState<RoleApiResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  // ... one <entity, open> pair per dialog

  // eligibility derived from server-provided status, not re-derived rules
  const allDraftRoleIds = data?.flatMap(role =>
    role.status.value === ROLE_STATUSES.DRAFT && role.id !== null ? [role.id] : []
  ) || [];

  return { /* state, dialog states + setters, handlers */ };
}
```

Rules:

- **Calls handlers, never services or `api/`.** Mutations go `hook → handler → service → api`.
- **`router.refresh()` after every successful mutation** — that re-runs the Server Component read. This is the SSR equivalent of React Query invalidation; there is no client cache to update.
- Mutation handlers return `boolean` so the caller can clear selection only on success.
- Selection is a `Set<string>`; spread to an array (`[...selectedIds]`) at the handler call site.
- Eligibility comes from server-provided status values (`status.value === DRAFT`), never from re-implemented business rules.
- Group the returned object with comments — `// State`, `// Dialog states`, `// Handlers`.

## `<Entity>Dialogs.tsx`

One component receiving `tableState`, rendering every dialog for the section. Keeps `(table)/index.tsx` readable and gives each dialog a single mount point. Dialogs are controlled and presentational: `open` / `onOpenChange` in, callbacks out.

Use `next/dynamic` for any dialog not needed on first paint.

## `AddAndEdit<Entity>.tsx` — the module's form

The create/edit dialog. **React Hook Form + `zodResolver`**, with a local
`validations/<entity>.schema.ts` that composes fields off the shared schema's `.shape` rather than
redefining them. `mode: 'onChange'`, `defaultValues` from a `getEmptyDefaults()` helper, `Controller`
for every controlled input, and an explicit `form.reset(..., { keepErrors: false, ... })` plus
`form.clearErrors()` whenever the dialog opens or the record changes.

Full contract, including the narrow case where plain `useState` is acceptable:
`frontend-components` / `admin-components`, "Forms".

## Shared table primitives — `@repo/ui/components/common/table`

Use these; do not build per-module equivalents:

| Component | Purpose |
|---|---|
| `Filter` | URL-backed search/select filters; owns debounce, clear, active-filter state |
| `Pagination` | Offset pagination from the API's `pagination` object |
| `Empty` | Empty vs. filtered-empty panel |
| `BulkActionBar` | Renders only when a selection exists |
| `TableHeaderRow` + `TableHeaderItem` | Header cells as **data**, not markup |
| `TableSkeleton` | First-load skeleton |
| `TableTitle` | Page title + description |
| `GroupedTable`, `LabelInputCell`, `SortableHeaderLabel` | Grouped rows, inline-edit cells, sortable headers |

**Table headers are data.** Build a `TableHeaderItem[]` — select-all checkbox is item 0 — and hand it to `TableHeaderRow`:

```tsx
const headerItems: TableHeaderItem[] = [
  { className: 'text-muted-foreground w-10', showCheckbox: true, checked: isAllSelected, onCheckedChange: handleSelectAll },
  ...ROLE_HEADER_LABELS.map(label => ({ label, className: 'text-muted-foreground' })),
];
```

## Checklist

- [ ] `Presenter.tsx` is an async Server Component; no `'use client'`
- [ ] It calls the service with `searchParams` and destructures `pagination` / `data` / `counts`
- [ ] `EmptySection` gets distinct `emptyMessage` and `filteredMessage`
- [ ] `(filter)/index.tsx` builds `FilterField[]` from server counts, labels from the API
- [ ] `(table)/index.tsx` is the Client boundary and passes `tableState` as one prop
- [ ] Table-state hook is co-located at `(table)/use<Entity>Table.ts`
- [ ] The hook calls handlers, returns booleans, and calls `router.refresh()` on success
- [ ] Bulk actions clear selection only on success
- [ ] Eligibility read from server-provided status values
- [ ] Shared `@repo/ui` table primitives used; headers built as `TableHeaderItem[]`
- [ ] Every testId sourced from `utils/testids.ts`
