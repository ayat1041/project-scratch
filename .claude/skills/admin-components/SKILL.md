---
name: admin-components
description: Layer A2 — React components in apps/admin modules. Use when building a Presenter, filter zone, table, row, action, or dialog. Same conventions as apps/frontend — one-component-per-file, prop-drilling rules, dynamic dialogs, and where the Client boundary sits.
---

# A2 — Components (`components/`)

Components render and handle user interaction. Nothing else. They call **handlers** (mutations) or **hooks** (state) — never a service, never `api/`, never `fetch`. The one exception is the async Server Component `Presenter.tsx`, which calls the service for the SSR read.

Identical to `frontend-components`; only the paths differ.

## First: pick the module pattern

| Need | Pattern skill | Admin reference |
|---|---|---|
| Searchable/filterable table, fresh on navigation | **`nextjs-list-page-pattern`** | none yet — see the pattern skill |
| Live data, polling, optimistic rows, shared selection | **`nextjs-live-table-pattern`** | none yet — see the pattern skill |

Load the pattern skill for the full contract. This skill covers the conventions that apply to every component in either pattern.

## Canonical structure

```
components/
├── Presenter.tsx              async Server Component — SSR read + layout
├── (header)/index.tsx         title + primary action
├── (filter)/index.tsx         'use client' — FilterField[] from server counts
└── (table)/
    ├── index.tsx              'use client' — the Client boundary
    ├── use<Entity>Table.ts    table-state hook, CO-LOCATED
    ├── <Entity>Table.tsx
    ├── <Entity>TableHeader.tsx
    └── <Entity>Dialogs.tsx    every dialog, driven by tableState
```

A module built before this shape solidifies can drift from it — hook in top-level `hooks/`, dialogs in `components/dialogs/`, no testids, no `(header)/`. Treat that as debt to converge toward this shape, not precedent to copy.

## Where `'use client'` goes — and where it does not

- **`Presenter.tsx` — never.** It is `async` and server-only.
- **`(filter)/index.tsx` — yes.** It renders the interactive shared `Filter`.
- **`(table)/index.tsx` — yes.** This is the Client boundary; it owns the table-state hook.
- **Rows, header, content — only if the file itself** calls `useState` / `useEffect` / `useReducer`, touches a browser API, or wires its own `onClick` handlers (as `PermissionRow.tsx` does).

Being rendered inside a Client Component's subtree does **not** require a descendant to redeclare the directive. Adding it needlessly widens the client bundle.

## Presenter

Owns the read and the layout. No selection state, no dialog state, no business logic, no `try/catch`.

```typescript
export default async function RolePresenter({ searchParams }: Props) {
  const data = await getAllRoles(searchParams);
  return (
    <>
      <FilterSection counts={data.counts} />
      <TableSection data={data.data} />
      <PaginationSection pagination={data.pagination} length={!!data.data.length} />
      <EmptySection
        length={data.data.length}
        searchParams={searchParams}
        emptyMessage="No roles added yet."
        filteredMessage="No roles match your filters."
      />
    </>
  );
}
```

`EmptySection` takes **two distinct messages** — genuinely empty versus filtered-to-nothing. Always supply both.

## Table section

Calls the co-located hook and passes the result as **one `tableState` prop**:

```typescript
const tableState = useRoleTable(data);
<RoleTable data={data} tableState={tableState} />
<RoleDialogs tableState={tableState} />
```

The hook returns a wide surface; naming twenty fields individually across the table and dialog boundaries is exactly the prop-drilling this convention avoids. Bulk actions clear the selection **only on success**, which is why the hook's mutation handlers return a boolean.

## One component per file

Every `.tsx` exports exactly one component. A named, multi-line (roughly 10+ line) function with its own props interface returning JSX **is** a component — give it its own file. `(table)/` should follow this shape: `RoleParentRow.tsx`, `PermissionRow.tsx`, `ExpandToggleRow.tsx`, `RolesTableHeader.tsx` as separate files rather than nested inside `RolesTableContent.tsx`.

A `.map()` callback returning inline JSX, or a one-line formatting helper, is not a component for this rule.

## No unnecessary prop drilling

A component must not declare a prop it never reads, purely to forward it.

The Client boundary at `(table)/index.tsx` exists specifically to hold client-only state its Server Component parent cannot. **That hop is structurally necessary and stays.** What must not happen is naming each unrelated field individually across it — pass `tableState` as one object, or bundle related fields (`roleFlags: RoleFlags`, `rowActions: RowActions`; see `types/domain.ts` in `modules/user-management/roles/`).

A prop the component both reads and forwards is not drilling.

## Shared table primitives

Use `@repo/ui/components/common/table` — never a per-module equivalent:
`Filter`, `Pagination`, `Empty`, `BulkActionBar`, `TableHeaderRow` + `TableHeaderItem`, `TableSkeleton`, `TableTitle`, `GroupedTable`, `LabelInputCell`, `SortableHeaderLabel`.

**Table headers are data**, not markup — build a `TableHeaderItem[]` with the select-all checkbox as item 0 and hand it to `TableHeaderRow`.

Confirmations use the shared `AlertDialogWrapper`. Status badges render the **API's** label with a locally-mapped colour — never a client-side copy of the text.

## The no-data states belong to the table section

Never the Presenter:

| Situation | Treatment |
|---|---|
| No rows, filters active | `EmptySection` `filteredMessage` — offers to clear filters |
| No rows, genuinely empty | `EmptySection` `emptyMessage` — offers the primary action |
| Read failed, nothing to show | Error panel |
| Read failed, rows still on screen | Inline error banner above the table |
| First load in flight | shared `TableSkeleton` |

**Empty and failed must look different.** An admin who reads an empty table as "nothing to manage" while the API is down will act on the wrong conclusion — and in this app that means a user waits indefinitely for a role change that never happened.

## Dialogs and forms

- Every modal not needed for first paint: `const DeleteRoleDialog = dynamic(() => import('../dialogs/DeleteRoleDialog').then(m => m.DeleteRoleDialog));`
- Dialogs are controlled and presentational — `open` / `onOpenChange` in, callbacks out. The hook owns open state; the parent calls the handler.
- **Destructive actions render a confirm dialog before calling the handler.** Deleting a role or revoking a permission affects every user currently assigned it.

## Forms — React Hook Form by default

**Default: React Hook Form + `zodResolver`.** `SignInForm` and `OtpChangePasswordForm` already use it in
`apps/admin/modules/auth/` today — follow that shape for any structured entity form, e.g.
`AddAndEditRole`, `AddAndEditPermission`.

### Canonical setup

```typescript
const form = useForm<RoleFormValues>({
  resolver: zodResolver(roleFormSchema),
  defaultValues: getEmptyDefaults(),
  mode: 'onChange',
});
```

- `mode: 'onChange'` — errors surface as the user types, not only on submit.
- `defaultValues` from a `getEmptyDefaults()` helper, never an inline object literal — the same helper seeds the reset.
- `Controller` for every controlled input (select, multi-select, date picker). A form like `AddAndEditRole`, with a permission multi-select plus an expiry date, needs it for both.
- Reset explicitly when the dialog opens or the record changes, and clear stale errors:

```typescript
form.reset(values, {
  keepErrors: false, keepDirty: false, keepTouched: false,
  keepIsSubmitted: false, keepSubmitCount: false, keepIsValid: false,
});
form.clearErrors();
```

  A dialog reused across records leaks the previous record's errors and dirty state without this.

### The form schema composes shared fields — it never redefines them

`validations/<entity>.schema.ts` pulls each field off the shared schema's `.shape`:

```typescript
export const roleFormSchema = z.object({
  name:        appRolesSchema.shape.name,
  permissions: z.array(z.number().int()),
  description: appRolesSchema.shape.description.unwrap(),
  // Shared field has min(2) which rejects ''; the form allows empty when roleType !== 'custom'.
  label: z.string().refine(val => val === '' || val.length >= 2, { /* ... */ }),
});
```

This is the rule that keeps the form and the backend enforcing the **same** constraint with the
**same** message. Relax or override a field only with an inline comment saying why, as above.
Never retype a rule the shared schema already expresses.

Where a form field name differs from the API field name (`selectedPermissions` -> `permissions`),
remap it on submit and note it in the schema.

### When plain `useState` is acceptable

Exactly one case: **a single control whose validation is entirely server-owned.**

A hypothetical `BulkAssignPermissions` + `BulkAssignDialog` is the shape: the textarea holds
`permissionKeys` / `keyErrors` / `isAssigning` in `useState` because the backend enforces every
rule — key format, duplicates, already-assigned, already-attached, protected permissions — and
returns them as a 422 `details` object the dialog renders inline as categories. There is no
client-side schema to resolve against, so RHF would add ceremony without validation.

That exception does **not** extend to a multi-field form, or to any field with a client-side rule.
If you are writing a second field, or a `.min()`, use RHF.

### Known debt — do not copy

The auth forms `ResetPasswordForm` and `ForgotPasswordForm` hand-roll
`const handleSubmit = async (e: React.FormEvent)` with no library and no resolver. They
re-implement — inconsistently — what RHF provides, on some of the most security-sensitive forms in
the app. Migrate them to RHF + `zodResolver` when you touch them; never use them as a model.

Field errors render from `formState.errors.<field>.message`. The schema **VALUE** is imported
plainly — `import type` on a schema passed to `zodResolver` compiles and then throws at runtime.

Admin adds one rule: free text that becomes user-facing — a role's `description`, shown to every
admin who assigns it — validates through the **shared** schema in `@repo/schemas-types`, not an
ad-hoc length check, so admin and backend agree on the rule.

## Test IDs

Never inline a raw `data-testid`. Import the `as const` group from `utils/testids.ts`. Row-level ids use a `_PREFIX` constant plus the row id.

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Client component calls a service or `api/` | Handler for mutations; Presenter for the read |
| `'use client'` on `Presenter.tsx` | It is an async Server Component |
| `'use client'` on a row that needs no client API | Remove it |
| `sonner` imported in a component or hook | `handlers/` only |
| `searchParams` mirrored into `useState` | The Presenter read them server-side |
| Sub-component defined inline in the same file | Own file |
| Static dialog import in a table | `next/dynamic` |
| Twenty hook fields destructured across the client hop | Pass `tableState` as one prop |
| Business logic or extra fetching in the Presenter | Move to the service |
| Role check inside a leaf component | Branch at `page.tsx` or middleware |
| Destructive action wired straight to a handler | Confirm dialog first |
| A third table shape invented for one screen | Use one of the two canonical patterns |

## Checklist

- [ ] Pattern chosen and its skill loaded
- [ ] `Presenter.tsx` is an async Server Component doing read + layout only
- [ ] `(table)/index.tsx` is the Client boundary; `tableState` passed as one prop
- [ ] Table-state hook co-located at `(table)/use<Entity>Table.ts`
- [ ] Rows carry no needless `'use client'`
- [ ] One component per file
- [ ] Shared `@repo/ui` table primitives used; headers built as `TableHeaderItem[]`
- [ ] Empty, filtered, error, and loading states all present and distinguishable
- [ ] Dialogs dynamic, controlled; destructive actions confirmed
- [ ] Test IDs from `utils/testids.ts`
- [ ] `pnpm --filter admin build` passes
