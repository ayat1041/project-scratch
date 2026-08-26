---
name: admin-section-context
description: Layer A3 — co-located section contexts and subtree providers in apps/admin. Use when sibling components must share selection state, when deciding whether a context is justified at all, or when mounting a provider in layout.tsx. Mirrors frontend-section-context.
---

# A3 — Section Context

A context is the exception, not the default. Same rules as `apps/frontend` — see `frontend-section-context` for the long form and `nextjs-live-table-pattern` for the full contract.

Nothing in `apps/admin` needs one today: the list-page pattern keeps selection in the co-located table-state hook, which is enough while one Client boundary owns the whole section. Reach for a context only when that stops being true.

## When a context is justified

| Situation | Verdict |
|---|---|
| A bulk-action bar and a table are **siblings** and share a selection | ✅ Section context |
| Static, page-load reference data (dropdown options, lookups) needed by scattered leaves | ✅ Subtree context in `context/` |
| One Client boundary already owns both the selection and the table | ❌ Use the table-state hook |
| Filters, search, sort, pagination | ❌ URL state, read server-side by the Presenter |
| Server data needed by two components | ❌ Pass it down from the Presenter, or share one query hook |
| A prop crossing one intermediate component | ❌ Bundle into an object prop or use `children` |

If the answer is the table-state hook, stop — adding a provider for state one component already owns is pure indirection.

## Placement

Co-located with the section it serves, not in a top-level `context/`:

```
components/(<entity>)/<Entity>SectionContext.tsx
```

A `context/` folder is only for subtree-wide static reference data.

## Shape

```typescript
'use client';

const XSectionContext = createContext<XSectionValue | null>(null);

export function useXSection() {
  const context = useContext(XSectionContext);
  if (!context) throw new Error('useXSection must be used inside an XSectionProvider');
  return context;
}

export function XSectionProvider({ children }: { children: ReactNode }) { /* ... */ }
```

Rules:

- Owns **selection state and derived eligibility**. Not filters, not pagination — those live in the URL.
- Eligibility derives from **server-provided flags** on each row, never from re-implemented client-side rules.
- Expose selection as a plain id array when that is what the mutation endpoints accept.
- The `use<Section>()` consumer hook **throws** outside its provider. Never return `undefined` and let callers guard.
- Memoize the value with `useMemo` and callbacks with `useCallback` — a provider re-render otherwise re-renders every consumer.
- A context **never** calls a service or `api/`. It consumes hooks and calls handlers.

## Mounting

Mount in the route's sibling `layout.tsx` so `page.tsx` stays a Server Component:

```typescript
export default function RolesAndPermissionsLayout({ children }: { children: ReactNode }) {
  return <XSectionProvider>{children}</XSectionProvider>;
}
```

**Suspense:** a provider that reads `useSearchParams` needs its own `<Suspense>` boundary **in that layout**. A boundary inside `page.tsx` cannot cover its layout ancestor, and this fails at `next build`, not `dev`.

## Checklist

- [ ] Justified by siblings sharing state a single hook cannot own
- [ ] Co-located with its section
- [ ] `'use client'` present
- [ ] Owns selection only — no filters, no pagination, no server data of its own
- [ ] Eligibility from server flags
- [ ] Consumer hook throws outside the provider
- [ ] Value and callbacks memoized
- [ ] Provider in `layout.tsx` with its own `<Suspense>` if it reads search params
