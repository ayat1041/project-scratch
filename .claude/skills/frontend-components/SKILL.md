---
name: frontend-components
description: Layer L2 — React components in modules/<domain>/<feature>/components. Use when creating or reviewing presenters, sections, zone folders, table rows, action components, dialogs, or forms. Covers one-component-per-file, prop-drilling rules, dynamic dialog imports, and server/client boundaries.
---

# L2 — Components (`components/`)

Components render and handle user interaction. Nothing else. They call **handlers** (mutations) or **hooks** (reads) — never a service, never `api/`, never `fetch`. The one exception is an async Server Component `Presenter.tsx`, which may call the service for the SSR read.

## First: pick the module pattern

`apps/frontend` and `apps/admin` share **two** canonical component shapes. Load the matching skill before writing a component:

| Need | Pattern | Skill | Reference |
|---|---|---|---|
| Searchable/filterable table, data fresh on navigation | SSR list page — `Presenter.tsx` + `router.refresh()` | **`nextjs-list-page-pattern`** | `modules/user-management/api-keys/`, `.../user-preferences/` (hypothetical — apps/frontend has no live CRUD module left besides auth) |
| Live data, polling, optimistic rows, siblings sharing a selection | React Query live table | **`nextjs-live-table-pattern`** | `modules/user-management/users/` (hypothetical) |
| Profile/section page with an owner-edit and a public view | Profile pattern (below) | this skill | `modules/user-management/profile/` (hypothetical) |

Default to the list-page pattern. Model a new list-page module on the shape below — users (invitations), user-preferences, api-keys illustrate the pattern; copy their shape rather than an older module.

## Folder shape — table / list page (current standard)

Parentheses folders carry no routing meaning inside `modules/` — they group a UI region and keep the folder name out of import noise.

```
components/
├── (header)/                      page chrome above the data
│   ├── SearchSection.tsx          writes `search` to the URL via shared Filter
│   ├── AddMember.tsx              primary action + its dialog
│   └── TabSection.tsx             fetches once, branches to a Presenter per tab
├── (<entity>)/                    one folder per entity/tab
│   ├── <Entity>SectionContext.tsx selection state shared by siblings
│   ├── FilterSection.tsx
│   ├── BulkActions.tsx            rendered only when a selection exists
│   ├── TableSection.tsx           header row + body + pagination
│   ├── <Entity>TableRow.tsx
│   └── ReSend.tsx / Cancel.tsx / Remove.tsx   one action per file
├── dialogs/                       controlled, presentational (props in, callbacks out)
└── pages/
    └── <Entity>Presenter.tsx      layout-only composition
```

Reference: `modules/user-management/users/components/`, `modules/user-management/api-keys/components/` (hypothetical).

## Folder shape — profile / section page

```
components/
├── pages/
│   ├── <Domain>Page.tsx           Client Component, owner/edit view
│   └── <Domain>PageServer.tsx     Server Component, public read-only view
├── sections/<section-name>/       kebab-case: header/, bio/, activity-log/
│   ├── <Domain><Name>Section.tsx
│   └── <Domain><Name>SectionComponent.tsx
└── shared/                        local reusable primitives
```

## Presenter rule

`pages/<X>Presenter.tsx` composes sections and owns layout — **nothing else**. No fetching, no selection state, no business logic. It receives already-fetched data as props.

```typescript
export default function InvitationsPresenter({ invitations, pagination, statusSummary }: Props) {
  return (
    <div className="pt-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterSection statusSummary={statusSummary} />
          <BulkActions />
        </div>
        <TableSection invitations={invitations} pagination={pagination} />
      </div>
    </div>
  );
}
```

## One action, one file

A mutation with both a row-level and a bulk-level trigger is a **single** component. The row and the bulk bar render the same file. It owns its confirm dialog, calls the handler, then refetches.

```typescript
// components/(invitations)/ReSend.tsx — used by the row AND the bulk bar
export default function ReSend({ invitationIds, isBulk }: { invitationIds: string[]; isBulk: boolean }) {
  const { refetchInvitations, clearSelection } = useInvitationsSection();
  // isBulk switches copy, button variant, and test ids
}
```

**`isBulk` is an explicit prop — never derived as `invitationIds.length > 1`.** A bulk selection can narrow to exactly one *eligible* id, and the bar must still read as bulk.

Bulk clears the selection afterwards; row does not. **Both refetch in `finally`** — a failed mutation still needs the list resynced.

## One component per file

Every `.tsx` exports exactly one component. A named, multi-line (roughly 10+ line) function with its own props interface that returns JSX **is** a component — extract it into its own file in a sibling folder named after the parent:

```
header/
├── TimezoneEditDialog.tsx
└── timezone-dialog/            new sibling folder, named after the parent
    ├── TimezoneRow.tsx
    └── TimezoneRowList.tsx
```

Matches the existing convention: `location-dialog/CountrySelect.tsx`, `name-dialog/LegalNameInput.tsx`, `role-card/RolePermissionsSection.tsx`.

A `.map()` callback returning inline JSX, or a one-line formatting helper, is **not** a component for this rule.

## No unnecessary prop drilling

A component must not declare a prop it never reads, purely to forward it unchanged to a descendant. Fix by the shape of the problem:

| Shape | Fix |
|---|---|
| Static page-load reference data (dropdown options, lookups) needed by scattered leaves across a deep tree | React Context scoped to that subtree — `<X>Provider` + `use<X>()` that throws outside the provider (see `context/profile-dropdown-options-context.tsx`) |
| Several unrelated fields/callbacks crossing one structurally-necessary boundary | Bundle into one object prop (`reviewFlags`, `rowActions`) |
| A one-off local bundle used only to build one child's JSX | `children` composition |

A prop the component both **reads and forwards** is not drilling.

## Dialogs

Every modal not needed for first paint is dynamically imported:

```typescript
import dynamic from 'next/dynamic';
const NameEditDialog = dynamic(() => import('./NameEditDialog'));
```

Dialogs in `dialogs/` are **controlled and presentational**: `open` / `onOpenChange` in, callbacks out. The parent owns open state and calls the handler.

## Forms — React Hook Form by default

**Default: React Hook Form + `zodResolver`.** Every structured entity form in the canonical
modules uses it — `AddAndEditApiKey`, `AddAndEditUserPreference`, `SetApiKeyRateLimit`.

### Canonical setup

```typescript
const form = useForm<ApiKeyFormValues>({
  resolver: zodResolver(apiKeyFormSchema),
  defaultValues: getEmptyDefaults(),
  mode: 'onChange',
});
```

- `mode: 'onChange'` — errors surface as the user types, not only on submit.
- `defaultValues` from a `getEmptyDefaults()` helper, never an inline object literal — the same helper seeds the reset.
- `Controller` for every controlled input (select, date picker, file upload). `AddAndEditApiKey` wraps 4 of them.
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
export const apiKeyFormSchema = z.object({
  label:     apiKeyRecordBaseSchema.shape.label,
  scope:     apiKeyRecordBaseSchema.shape.scope.optional(),
  expiresAt: apiKeyRecordBaseSchema.shape.expiresAt,
  // Shared field has min(2) which rejects ''; the form allows empty when scopeType !== 'restricted'.
  allowedOrigin: z.string().refine(val => val === '' || val.length >= 2, { /* ... */ }),
});
```

This is the rule that keeps the form and the backend enforcing the **same** constraint with the
**same** message. Relax or override a field only with an inline comment saying why, as above.
Never retype a rule the shared schema already expresses.

Where a form field name differs from the API field name (`neverExpires` -> `hasNoExpiration`),
remap it on submit and note it in the schema.

### When plain `useState` is acceptable

Exactly one case: **a single control whose validation is entirely server-owned.**

`AddMember` + `InviteModalDialog` is the reference. The invite textarea holds `inviteEmails` /
`emailErrors` / `isSendingInvites` in `useState` because the backend enforces every rule — email
format, duplicates, already-invited, already-attached, protected addresses — and returns them as a
422 `details` object the dialog renders inline as categories. There is no client-side schema to
resolve against, so RHF would add ceremony without validation.

That exception does **not** extend to a multi-field form, or to any field with a client-side rule.
If you are writing a second field, or a `.min()`, use RHF.

### Known debt — do not copy

The auth forms (`SignUpForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `ValidateResetCodeForm`)
hand-roll `const handleSubmit = async (e: React.FormEvent)` with no
library and no resolver. They re-implement — inconsistently — what RHF provides, on the most
security-sensitive forms in the app. Migrate them to RHF + `zodResolver` when you touch them; never
use them as a model.

Field errors render from `formState.errors.<field>.message`. See `frontend-error-handling` for all four error modes.

## Server / client boundary

- Default: Server Component, no directive.
- Add `'use client'` only for `useState` / `useEffect` / `useReducer` / event handlers / browser APIs / context consumers.
- Never `fetch` inside a leaf Server Component — the page calls the service and passes props down.
- Never read `window` / `document` / `localStorage` in a Server Component.

## Shared table primitives

Use `@repo/ui/components/common/table` — do not build per-module equivalents:
`Filter`, `Pagination`, `Empty`, `BulkActionBar`, `TableHeaderRow` + `TableHeaderItem`,
`TableSkeleton`, `TableTitle`, `GroupedTable`, `LabelInputCell`, `SortableHeaderLabel`.

**Table headers are data**, not markup — build a `TableHeaderItem[]` with the select-all
checkbox as item 0 and hand it to `TableHeaderRow`:

```tsx
const headerItems: TableHeaderItem[] = [
  { className: 'text-muted-foreground w-10', showCheckbox: true, checked: isAllSelected, onCheckedChange: handleSelectAll },
  ...INVITATION_HEADER_LABELS.map(label => ({ label, className: 'text-muted-foreground' })),
];
```

Confirmations use the shared `AlertDialogWrapper`. Status badges render the **API's**
label with a locally-mapped colour — never a client-side copy of the text.

## The no-data states belong to the table section

`TableSection` decides between rows, empty, and error — never the Presenter:

| Situation | Component |
|---|---|
| No rows, filters active | `EmptyState` / `EmptySection` `filteredMessage` — offers to clear filters |
| No rows, genuinely empty | `EmptyState` / `EmptySection` `emptyMessage` — offers the primary action |
| Read failed, nothing to show | `ErrorState` |
| Read failed, rows still on screen | `InlineErrorBanner` above the table |
| First load in flight | shared `TableSkeleton` |

In the live-table pattern all of these render through `(common)/StatePanel` so tabs cannot
drift apart visually. **Empty and failed must look different** — a user who reads an empty
table as "nothing here" while the API is down acts on the wrong conclusion.

## Test IDs

Never inline a raw `data-testid` string. Import the group from `utils/testids.ts`:

```typescript
import { API_KEY_TABLE } from '../../utils/testids';

<Checkbox data-testid={`${API_KEY_TABLE.ROW_CHECKBOX_PREFIX}${row.id}`} />
```

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Component calls `fetch`, a service, or `api/` | Handler (mutate) or hook (read) |
| `sonner` imported in a component | Toast lives in `handlers/` only |
| Sub-component defined inline in the same file | Extract to a sibling folder file |
| Static import of a dialog in a section | `next/dynamic` |
| Ownership check inside a leaf component | Branch at `page.tsx` |
| `response.data?.field` without narrowing | `if (response.success) { response.data.field }` |
| Filter/pagination state mirrored in `useState` | Keep it in the URL |
| `useEffect` deps suppressed with `eslint-disable` | Stabilize with `useCallback` or restructure |
| Type redefined locally when it exists in `@repo/schemas-types` | Import it directly, canonical name |

## Checklist

- [ ] One component per file; sub-pieces extracted
- [ ] `'use client'` only where genuinely required
- [ ] Calls a handler or a hook — never a service, `api/`, or `fetch`
- [ ] No `sonner` import
- [ ] No purely-forwarded props
- [ ] Dialogs dynamically imported and controlled
- [ ] Test IDs sourced from `utils/testids.ts`
- [ ] Presenter holds layout only
