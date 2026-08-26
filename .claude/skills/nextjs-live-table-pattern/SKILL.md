---
name: nextjs-live-table-pattern
description: The canonical React Query live-table module shape shared by apps/frontend and apps/admin — use<Feature>Query, use<Feature>QueryParams, section context, one-action-one-file, StatePanel states. Use when a table needs client-side reads, polling, optimistic updates, or sibling components sharing a selection.
---

# Canonical Live-Table Module (frontend **and** admin)

The second of the two module shapes. Same stack, same rules as `nextjs-list-page-pattern` — this one applies when the data must live on the client.

**Reference implementation:** `apps/frontend` has no live-table module in the current tree. The
running example below — a hypothetical `user-management/api-keys` module (users managing their
own API keys, with keys sitting in transient `generating` / `revoking` states) — illustrates the
shape a new module would follow, identically in `apps/admin`.

## Which pattern?

| Need | Pattern |
|---|---|
| Searchable/filterable table, data fresh on navigation | `nextjs-list-page-pattern` — SSR Presenter + `router.refresh()` |
| Rows in a transient state that must update without a reload (`queued`, `sending`) | **This one** — React Query with conditional polling |
| Optimistic row updates | **This one** |
| Sibling components sharing a selection across a section | **This one** — section context |
| Several components needing the same server data without prop drilling | **This one** — one hook, one cache entry |

Default to the list-page pattern. Reach for this one when the data genuinely changes under the user.

## Shape

```
modules/<domain>/<module>/
├── api/ services/ handlers/ types/ utils/ validations/     as in the list-page pattern
├── hooks/
│   ├── use<Feature>Query.ts           React Query list + summary + polling
│   ├── use<Feature>QueryParams.ts     search / status / limit / offset from the URL
│   └── use<Other>Query.ts
└── components/
    ├── (common)/StatePanel.tsx        shared empty / filtered / failed panel
    ├── (header)/
    │   ├── SearchSection.tsx          shared Filter writing ?search= to the URL
    │   ├── Add<Entity>.tsx            primary action + its dialog + orchestration
    │   └── TabSection.tsx             runs the query once, branches to a Presenter
    ├── (<entity>)/
    │   ├── <Entity>SectionContext.tsx selection + eligibility + refetch
    │   ├── FilterSection.tsx          status select fed by the API status summary
    │   ├── BulkActions.tsx            bar shown only when a selection exists
    │   ├── TableSection.tsx           header + body + pagination; owns the no-rows case
    │   ├── EmptyState.tsx             no rows — filtered or genuinely empty
    │   ├── ErrorState.tsx             read failed, nothing left to show
    │   ├── InlineErrorBanner.tsx      read failed, rows still on screen
    │   ├── <Entity>TableRow.tsx
    │   ├── <Entity>StatusBadge.tsx    API label + locally-mapped colour
    │   └── Regenerate.tsx / Revoke.tsx / Remove.tsx   one action per file, row AND bulk
    ├── dialogs/<Entity>ModalDialog.tsx  controlled, presentational
    └── pages/<Entity>Presenter.tsx      layout composition only
```

Here the hooks live in a **top-level `hooks/`** — they are server-state and URL hooks, not section-local UI state.

## Read flow

```
URL ?search=&status=&limit=&offset=
  ↓ use<Feature>QueryParams()
  ↓ use<Feature>Query({ userId, status, search, limit, offset })
  ↓ service.getX()          wire DTO → domain type (ISO strings → Date)
  ↓ api.getX()              builds the query string, throws createApiError on !ok
  ↓ TabSection → Presenter → FilterSection / BulkActions / TableSection
```

```typescript
export const API_KEYS_QUERY_KEY = 'userApiKeys';

export function useApiKeysQuery({ userId, status, search, limit, offset }: Params) {
  const listQuery = useQuery({
    queryKey: [API_KEYS_QUERY_KEY, userId, status, search, limit, offset],
    queryFn: () => apiKeysService.getApiKeys(userId, { status, search, limit, offset }),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
  return { apiKeys: listQuery.data?.apiKeys ?? [], isLoading: listQuery.isLoading, error: listQuery.error, refetch: listQuery.refetch };
}
```

- Export the query key as a named constant so mutation callers can invalidate it.
- Every result-affecting param belongs in the key.
- `keepPreviousData` on paginated tables so the UI does not flash empty between pages.
- **Poll only when the data says polling is warranted** — a row in a transient state — never unconditionally.
- Two components calling the hook with the same params share **one** request. That is the intended way to give a provider and a page section the same data without prop drilling.
- `userId` comes from Redux (`state.user.id`).

## Mutation flow

```
Action component (row or bulk)
  ↓ confirm dialog
handleXApiKeys(ids)     toast on success, handleErrorToast + re-throw on failure
  ↓ service.xApiKeys(ids)  →  api.xApiKeys({ ids })
  ↓ finally: refetchApiKeys()  +  clearSelection() when the action was bulk
```

Use `queryClient.invalidateQueries({ queryKey: [FEATURE_QUERY_KEY] })` instead of `refetch` when derived data (status counts, summaries) must refresh alongside the rows, or when the mutation fires outside the section provider.

## One action, one file — and `isBulk` is a prop

A mutation with both a row-level and a bulk-level trigger is **one** component. The row and the bulk bar render the same file.

```typescript
export default function Regenerate({ apiKeyIds, isBulk }: { apiKeyIds: string[]; isBulk: boolean }) {
```

**`isBulk` is an explicit prop, not `apiKeyIds.length > 1`.** A bulk selection can narrow to exactly one *eligible* id, and the bar must still read as bulk. It switches copy, button variant, and test ids.

Bulk clears the selection afterwards; row does not. **Both refetch in `finally`** — a failed mutation still needs the list resynced.

## Section context

Owns selection and derived eligibility for one section, and is mounted in the route's `layout.tsx`. See `frontend-section-context`.

- `selectedIds: string[]` — a plain array, because that is what the mutation endpoints take.
- `onToggleSelection`, `onSelectAll` (current page only), `clearSelection`.
- `regenerableIds` / `revocableIds` / `removableIds`, memoised from **server flags** on the selected rows. Eligibility is never re-derived from `status` in the client.
- `refetch` / `invalidate`, called by every action component after a mutation settles.
- `error` + `retry`, read off the same query entry.
- **Filters and pagination are deliberately not here** — they live in the URL.

## The three no-data states

`TableSection` owns the no-rows case — never the Presenter:

| Situation | Component |
|---|---|
| No rows, filters active | `EmptyState` — offers to clear the filter |
| No rows, genuinely empty | `EmptyState` — offers the primary action |
| Read failed, nothing to show | `ErrorState` |
| Read failed, rows still on screen | `InlineErrorBanner` above the table |
| First load in flight | shared `TableSkeleton` |

All of them render through `(common)/StatePanel` — a centered icon + title + description + optional action — so tabs cannot drift apart visually.

Distinguishing "empty" from "failed" is not cosmetic: a user who reads an empty table as "nothing here" when the API is down will act on the wrong conclusion.

## Client-side validation is often absent on purpose

`api-keys/validations/` holds **form schemas only**. API key rules — name format, duplicate names, max-keys-per-user exceeded, reserved key names — are deliberately not there: the backend enforces every one and returns them as a `422 details` object, and the frontend renders those categories inline. Re-implementing them client-side creates two rulesets that drift.

```
success → toast + close dialog + invalidateQueries([KEY])
422     → result.errors → setNameErrors → dialog renders each category inline
other   → handleErrorToast + throw
```

Typing in the field clears the previous categories — they describe what was submitted, not what is now in the box.

## Shared conventions with the list-page pattern

Presenters are layout only. Dialogs are controlled and presentational; confirmations use the shared `AlertDialogWrapper`. Table headers are built as `TableHeaderItem[]` and handed to `TableHeaderRow`. Status badges render the **API's** label with a locally-mapped colour. Every testId comes from `utils/testids.ts`.

## Checklist

- [ ] Pattern justified — live/polling/optimistic data, or siblings sharing a selection
- [ ] Hooks in a top-level `hooks/`: `use<Feature>Query`, `use<Feature>QueryParams`
- [ ] Query key exported and containing every result-affecting param
- [ ] `keepPreviousData` on pagination; polling conditional on transient state
- [ ] Filters/pagination in the URL, never in context or `useState`
- [ ] Section context owns selection + server-flag eligibility only
- [ ] One action per file; `isBulk` an explicit prop; both variants refetch in `finally`
- [ ] Bulk clears selection, row does not
- [ ] Empty / filtered / error / loading states all present and distinguishable, via `StatePanel`
- [ ] No client re-implementation of backend validation rules
- [ ] `<Suspense>` around every `useSearchParams` consumer
