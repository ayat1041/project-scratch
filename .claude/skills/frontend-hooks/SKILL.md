---
name: frontend-hooks
description: Layer L4 — hooks in apps/frontend. Use when adding a table-state hook, a React Query read hook, a URL search-param reader, or stateful async UI logic (debounce, abort, race guard). Covers where each kind lives, query keys, invalidation, polling, keepPreviousData, and the read-versus-mutate boundary.
---

# L4 — Hooks

Four kinds of hook, in **two** locations. Putting one in the wrong place is the most common drift.

| Kind | File | Location | Calls |
|---|---|---|---|
| **Table state** — selection, dialogs, loading, mutation handlers | `use<Entity>Table.ts` | **`components/(table)/`** — co-located | **handlers** |
| React Query read | `use<Feature>Query.ts` | top-level `hooks/` | service |
| URL params | `use<Feature>QueryParams.ts` | top-level `hooks/` | — |
| Stateful async (debounce, abort, race guard) | `use<Thing>.ts` | top-level `hooks/` | service |

Server-state and URL hooks live in `hooks/`. Section-local UI state lives beside its
section. One hook per file.

Reads have no toast boundary: a failed page load must not fire a toast, so failures surface
as inline error state the component renders.

## 0. Table-state hooks — `components/(table)/use<Entity>Table.ts`

The list-page pattern's client state. Reference: `modules/user-management/api-keys/components/(table)/useApiKeyTable.ts` (hypothetical).

```typescript
export function useApiKeyTable(data: ApiKeyGroupApiResponse[]) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<Record | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  // ... one <entity, open> pair per dialog

  return { /* State */ /* Dialog states + setters */ /* Handlers */ };
}
```

- Calls **handlers**, never services or `api/` — this is the one hook kind that goes through the toast boundary, because its operations are mutations.
- **`router.refresh()` after every successful mutation.** That re-runs the Server Component read; there is no client cache to invalidate in this pattern.
- Mutation handlers return `boolean` so the caller clears selection only on success.
- Selection is a `Set<string>`; spread to an array (`[...selectedIds]`) at the handler call site.
- Eligibility derives from server-provided status values, never re-implemented rules.
- The whole returned object is passed as **one `tableState` prop** to the table and the dialogs — see `nextjs-list-page-pattern`.

## 1. Read hooks (React Query)

```typescript
// hooks/useInvitationsQuery.ts
export const INVITATIONS_QUERY_KEY = 'userInvitations';

export function useInvitationsQuery({ roleId, status, search, limit, offset }: Params) {
  const listQuery = useQuery({
    queryKey: [INVITATIONS_QUERY_KEY, roleId, status, search, limit, offset],
    queryFn: () =>
      userInvitationsService.getInvitations(roleId, { status, search, limit, offset }),
    enabled: !!roleId,
    placeholderData: keepPreviousData, // keeps the table mounted while paging
  });

  return {
    invitations: listQuery.data?.invitations ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
  };
}
```

Rules:

- **Export the query key as a named constant** so mutation callers can `queryClient.invalidateQueries({ queryKey: [INVITATIONS_QUERY_KEY] })`.
- Every parameter that changes the result belongs in the `queryKey`. A missing param means stale data served across filters.
- Two components calling the same hook with the same params share **one** request — that is the intended way to give a provider and a page section the same data without prop drilling.
- `placeholderData: keepPreviousData` for paginated tables, so the UI does not flash empty between pages.
- `enabled: !!id` whenever the key depends on a value that can be empty on first render.
- **Poll only when the data says polling is warranted** (e.g. a row sitting in a transient `queued` state) — never unconditionally.
- Return a narrow, named surface (`invitations`, `isLoading`, `error`, `refetch`), not the raw query object.

## 2. URL param hooks

Filters, search, and pagination live in the URL — not React state — so they survive refresh and are shareable.

```typescript
// hooks/useInvitationsQueryParams.ts
export function useInvitationsQueryParams() {
  const searchParams = useSearchParams();
  return {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    offset: parseInt(searchParams.get('offset') || '0', 10),
    limit: parseInt(searchParams.get('limit') || '10', 10),
  };
}
```

- This hook **reads** only. The shared `Filter` / `Pagination` from `@repo/ui/components/common/table` write back to the URL — `Filter` does it through `@repo/ui`'s own `useFilterParams` (debounce, clear, active-filter state). Never re-implement the write side in a module.
- The key change re-runs the query — no manual refetch wiring is needed for filtering or paging.
- Never mirror these values into `useState` or a context.
- **Suspense:** any client component that reaches this hook must render under a `<Suspense>` boundary, or `next build` fails with `missing-suspense-with-csr-bailout`.

## 3. Stateful async UI hooks

Debouncing, abort controllers, and race-condition guards belong here. Call the service directly when the result feeds local state.

```typescript
export function useUserUrlValidation(options: UrlValidationOptions) {
  const [state, setState] = useState<UrlValidationState>(INITIAL_STATE);
  const requestVersionRef = useRef(0);

  const validateUrl = useCallback(
    async (url: string) => {
      const version = ++requestVersionRef.current;
      setState(prev => ({ ...prev, isChecking: true }));
      const result = await userProfileService.checkUrl(options.id, url);
      if (requestVersionRef.current !== version) return; // stale — discard
      setState({ isChecking: false, isAvailable: result.isUnique, error: null });
    },
    [options.id]
  );

  return { ...state, validateUrl };
}
```

- A version ref (or `AbortController`) is mandatory for any user-typed async check — otherwise a slow early response overwrites a fast later one.
- Debounce user input before firing the request.
- These hooks return `string[]` errors via `handleErrorMessage` for inline display — no toast. See `frontend-error-handling`, Mode 2.
- Hook option and result types live in `types/domain.ts` (`UrlValidationOptions`, `UrlValidationState`).

## Read vs. mutate

```
READ (client)  Component → Hook        → Service → API   inline error state, no toast
READ (SSR)     Presenter → Service     → API             inline error state, no toast
MUTATE         Component → Handler     → Service → API   toast + re-throw
MUTATE         Table-state hook → Handler → Service → API   toast + re-throw
```

There is **no read handler** — that would toast on page load. If you are about to add one,
you want a read hook or the Presenter.

Note the asymmetry: a *read* hook calls the service directly, while a *table-state* hook
calls handlers. The rule is about the operation, not the file type — every mutation crosses
the toast boundary, every read skips it.

## After a mutation

The action component calls the handler, then on settle:

```typescript
clearSelection();                                            // when bulk
queryClient.invalidateQueries({ queryKey: [FEATURE_QUERY_KEY] });
```

Prefer `invalidateQueries` over `refetch` when derived data (status counts, summaries) must refresh alongside the rows. Use the section context's `invalidate*` helper when one exists.

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Hook imports `sonner` | Toast belongs to `handlers/` |
| Hook calls `api/` or `fetch` | Read hooks call the service; table-state hooks call handlers |
| Table-state hook placed in top-level `hooks/` | Co-locate it at `components/(table)/use<Entity>Table.ts` |
| React Query or URL-param hook placed inside `components/` | Those belong in top-level `hooks/` |
| Table-state hook mutating without `router.refresh()` | The SSR read never re-runs; the table shows stale rows |
| Filter/pagination state in `useState` | Read from the URL |
| Query key missing a param used by the query fn | Add it to the key |
| Unconditional `refetchInterval` | Poll only while a transient state exists |
| Async check without a version/abort guard | Race — last response wins, not last request |
| `useEffect` deps suppressed with `eslint-disable` | Stabilize with `useCallback` or restructure |

## Checklist

- [ ] One hook per file, named `use<Feature>Query` / `use<Feature>QueryParams` / `use<Thing>`
- [ ] Calls the service layer only
- [ ] Query key exported and contains every result-affecting param
- [ ] `enabled` guard where the key can be empty
- [ ] `keepPreviousData` on paginated reads
- [ ] Polling conditional on transient data state
- [ ] Async user-input checks guarded against races
- [ ] No `sonner`, no `fetch`, no `api/` import
- [ ] Consumers of `useSearchParams` render under `<Suspense>`
