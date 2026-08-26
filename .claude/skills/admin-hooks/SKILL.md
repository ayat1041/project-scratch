---
name: admin-hooks
description: Layer A4 — hooks in apps/admin. Use when adding a table-state hook, a shared dialog hook, a URL search-param reader, or a React Query read. Covers where each kind lives, the router.refresh contract, and the read-versus-mutate boundary. Mirrors frontend-hooks.
---

# A4 — Hooks

Same four kinds as `apps/frontend`, in **two** locations. Putting one in the wrong place is the most common drift in this app.

| Kind | File | Location | Calls |
|---|---|---|---|
| **Table state** — selection, expansion, dialogs, loading, mutation handlers | `use<Entity>Table.ts` | **`components/(table)/`** — co-located | **handlers** |
| **Shared dialog wiring** reused by a table and a sibling detail page | `use<Entity>ActionDialogs.ts` | top-level `hooks/` | handlers |
| URL params | `use<Feature>QueryParams.ts` | top-level `hooks/` | — |
| React Query read *(none in admin yet)* | `use<Feature>Query.ts` | top-level `hooks/` | service |

Section-local UI state lives beside its section. Genuinely shared or server-state hooks live in `hooks/`. One hook per file.

## Table-state hooks — `components/(table)/use<Entity>Table.ts`

The list-page pattern's client state. No reference implementation exists yet in either app — see `nextjs-list-page-pattern` for the full contract; the shape below is what a compliant hook looks like.

```typescript
export function useRoleTable(data: RoleGroupResponse[]) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Record | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  // ... one <entity, open> pair per dialog

  return { /* State */ /* Dialog states + setters */ /* Handlers */ };
}
```

- Calls **handlers**, never services or `api/`. This is the one hook kind that crosses the toast boundary, because its operations are mutations.
- **`router.refresh()` after every successful mutation.** That re-runs the Server Component read. There is no client cache in this pattern — skip it and the table shows stale rows after a delete or update.
- Mutation handlers return `boolean` so the caller clears selection only on success.
- Selection is a `Set<string>`; spread to an array (`[...selectedIds]`) at the handler call site.
- Eligibility derives from server-provided status values, never re-implemented client-side rules.
- The whole returned object is passed as **one `tableState` prop** to the table and the dialogs.
- Group the returned object with comments — `// State`, `// Dialog states`, `// Handlers`.

## Shared dialog hooks

When dialog wiring — open state, feedback text, confirm handlers — is shared between a table and a sibling detail page, extract **one** hook into the parent module's `hooks/` rather than reimplementing it per consumer.

A shared dialog hook like a hypothetical `useRoleActionDialogs` works like this: the table hook tracks row selection (which a detail page does not need, since its id is a fixed prop) and passes the selected row's id into the shared hook on every render.

## URL param hooks

Filters, search, sort, and pagination live in the URL. In the list-page pattern the **Presenter reads them server-side**, so a client-side param hook is only needed when a Client Component itself must react to them.

```typescript
export function useRolesQueryParams() {
  const searchParams = useSearchParams();
  return { search: searchParams.get('search') || '', sortBy: searchParams.get('sortBy') || 'name' };
}
```

Read-only. The shared `Filter` / `Pagination` from `@repo/ui` do the writing — never re-implement the write side. Never mirror these into `useState` or a context.

**Suspense:** any client component reaching `useSearchParams` must render under `<Suspense>`, or `next build` fails with `missing-suspense-with-csr-bailout`. A provider mounted in `layout.tsx` needs its own boundary in that layout.

## React Query

Not used in admin today — reads are SSR through the Presenter. If a screen genuinely needs live or polling data, use the **same** contract as the frontend (`nextjs-live-table-pattern`): an exported query key containing every result-affecting param, `enabled` guards, `keepPreviousData` on pagination, and polling only while the data is in a transient state. Do not invent a third read mechanism.

## Read vs. mutate

```
READ (SSR)   Presenter → Service → API                inline error state, no toast
MUTATE       Component → Handler → Service → API      toast + re-throw
MUTATE       Table-state hook → Handler → Service → API   toast + re-throw
```

There is **no read handler** — that would toast during a page render.

The asymmetry is about the operation, not the file type: every mutation crosses the toast boundary, every read skips it.

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Table-state hook in top-level `hooks/` | Co-locate at `components/(table)/use<Entity>Table.ts` — a top-level `useApiKeysTableState` would be the outlier, not the pattern |
| Hook imports `sonner` | Toast belongs to `handlers/` |
| Table-state hook calls a service or `api/` | Call handlers |
| Table-state hook mutating without `router.refresh()` | The SSR read never re-runs; rows go stale |
| `searchParams` mirrored into `useState` | The Presenter already read them |
| Dialog wiring duplicated between a table and its detail page | One shared hook in the parent module's `hooks/` |
| `eslint-disable` on a `useEffect` dependency array | Stabilize with `useCallback` or restructure |
| A bespoke read mechanism | SSR Presenter, or the shared React Query contract |

## Checklist

- [ ] Hook kind placed in the right location
- [ ] Table-state hook co-located, calls handlers, returns booleans
- [ ] `router.refresh()` on every successful mutation
- [ ] Selection is a `Set<string>`, spread at the call site
- [ ] Eligibility from server-provided status values
- [ ] Shared dialog wiring extracted once, not duplicated
- [ ] No `sonner`, no direct service/`api/` call from a table-state hook
- [ ] `useSearchParams` consumers render under `<Suspense>`
- [ ] `pnpm --filter admin build` passes
