---
description: Add a hook to a frontend module's hooks/ layer (L4) — a React Query read hook, a URL search-param reader, or a debounced/aborted async hook.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Hook (L4)

## Step 1 — Pick the kind

| Need | Kind |
|---|---|
| Client-side read of list/detail data | React Query read hook — `use<Feature>Query.ts` |
| Read filters / search / pagination from the URL | URL param hook — `use<Feature>QueryParams.ts` |
| Debounced availability check, abortable request, race guard | Stateful async hook — `use<Thing>.ts` |
| A mutation | Not a hook — run `/frontend-handler` |

## Step 2 — Gather inputs

- Target module and the service function to call
- Every parameter that changes the result (these become the query key)
- Whether the data has a transient state that justifies polling
- Whether the list is paginated

## Step 3 — Required reading

- Skill `frontend-hooks`
- The module's existing hooks, for the return-surface style

## Step 4a — React Query read hook

```typescript
export const API_KEYS_QUERY_KEY = 'apiKeys';

export function useApiKeysQuery({ userId, status, search, limit, offset }: Params) {
  const listQuery = useQuery({
    queryKey: [API_KEYS_QUERY_KEY, userId, status, search, limit, offset],
    queryFn: () => apiKeysService.getApiKeys(userId, { status, search, limit, offset }),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });

  return {
    apiKeys: listQuery.data?.apiKeys ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
  };
}
```

- **Export the query key constant** — mutation callers need it for `invalidateQueries`.
- Every result-affecting param goes in the key. A missing one serves stale data across filters.
- `enabled` guard wherever a key value can be empty on first render.
- `placeholderData: keepPreviousData` on paginated lists.
- Poll **only** while the data itself says polling is warranted; never a bare `refetchInterval`.
- Return a named surface, not the raw query object.
- Calls the **service**, never a handler — reads have no toast boundary.

## Step 4b — URL param hook

```typescript
export function useApiKeysQueryParams() {
  const searchParams = useSearchParams();
  return {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    offset: parseInt(searchParams.get('offset') || '0', 10),
    limit: parseInt(searchParams.get('limit') || '10', 10),
  };
}
```

Read-only — the shared `Filter` / `Pagination` from `@repo/ui` do the writing. Never mirror these into `useState` or a context.

**Then check the Suspense boundary.** Every client component that reaches this hook must render under `<Suspense>`; a provider in `layout.tsx` needs its own boundary in that layout. This fails only at `next build`, so run the build.

## Step 4c — Stateful async hook

Mandatory for any user-typed async check: a version ref or `AbortController` so a slow early response cannot overwrite a fast later one.

```typescript
const version = ++requestVersionRef.current;
const result = await apiKeysService.checkLabel(options.id, label);
if (requestVersionRef.current !== version) return; // stale — discard
```

Debounce the input. Return errors as inline state via `handleErrorMessage`, never a toast. Option/state types go in `types/domain.ts` as `<Feature>Options` / `<Feature>State`.

## Step 5 — Constraints

- One hook per file, named `use<...>`
- Calls the service layer only — no `api/`, no `fetch`, no `sonner`
- No `eslint-disable` on `useEffect` deps — stabilize with `useCallback` or restructure

## Step 6 — Verify

```bash
pnpm --filter frontend lint
pnpm --filter frontend check-types
pnpm --filter frontend build     # catches missing Suspense boundaries
```

## Step 7 — Report

- Hook name, kind, exported query key (if any).
- Where the `<Suspense>` boundary lives, for URL-param consumers.
- Next: `/frontend-component`.
