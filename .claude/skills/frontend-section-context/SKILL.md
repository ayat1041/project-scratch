---
name: frontend-section-context
description: Layer L3 — co-located section contexts and subtree providers in apps/frontend. Use when sibling components must share selection state, when deciding whether a context is justified at all, or when mounting a provider in layout.tsx. Covers the provider/consumer-hook shape and what a context must never own.
---

# L3 — Section Context

A context is the exception, not the default. Add one only when **sibling** components must share state that cannot travel as props — canonically, row selection shared between a bulk-action bar and a table.

It is **co-located with the section it serves**, not in a top-level `context/` folder:

```
components/(invitations)/InvitationsSectionContext.tsx
components/(users)/UsersSectionContext.tsx
```

A `context/` folder exists only for subtree-wide static reference data (see `modules/user-management/profile/context/profile-dropdown-options-context.tsx`).

## When a context is justified

| Situation | Verdict |
|---|---|
| Bulk-action bar and table are siblings and share a selection | ✅ Section context |
| Static, page-load-once reference data (dropdown options, lookups) needed by scattered leaves | ✅ Subtree context in `context/` |
| Filters, search, pagination | ❌ URL state + `use<Feature>QueryParams` |
| Server data needed by two components | ❌ Both call the same React Query hook with the same params — one request, one cache entry |
| A prop passing through one intermediate component | ❌ Bundle it into an object prop or use `children` composition |

## Shape

```typescript
'use client';

interface InvitationsSectionValue {
  invitations: Invitation[];
  error: Error | null;
  retryInvitations: () => void;

  // Selection is a plain id array — exactly what every mutation endpoint takes,
  // so no Set-to-array conversion is needed at the call sites.
  selectedInvitationIds: string[];
  onToggleSelection: (invitationId: string) => void;
  onSelectAll: (selected: boolean) => void;
  clearSelection: () => void;

  // Action components call this after a mutation settles. Invalidates rather
  // than refetches, so status counts refresh alongside the rows.
  invalidateInvitations: () => void;

  // Eligibility is read off server-computed flags on each row, never
  // re-derived from `status` locally.
  resendableIds: string[];
  cancelableIds: string[];
  removableIds: string[];
}

const InvitationsSectionContext = createContext<InvitationsSectionValue | null>(null);

export function useInvitationsSection() {
  const context = useContext(InvitationsSectionContext);
  if (!context) {
    throw new Error('useInvitationsSection must be used inside an InvitationsSectionProvider');
  }
  return context;
}

export function InvitationsSectionProvider({ children }: { children: ReactNode }) {
  const { search, status, limit, offset } = useInvitationsQueryParams();
  const [selectedInvitationIds, setSelectedInvitationIds] = useState<string[]>([]);

  // Same params the page passes, so React Query serves both from one entry.
  const { invitations, error, refetch } = useInvitationsQuery({ roleId, status, search, limit, offset });
  // ...
}
```

## Rules

- The provider owns **selection state and derived eligibility**. It does **not** own filters or pagination — those live in the URL.
- The provider calls the module's read **hook** with the same params the page passes, so React Query serves both from one cache entry.
- Derive per-action eligibility from server-computed flags on each row (`isResendable`, `isCancelable`, `isRemovable`) — never by re-deriving from `status` in the client.
- Expose selection as a plain id array when that is what the mutation endpoints accept.
- The `use<Section>()` consumer hook **throws** when used outside its provider. Never return `undefined` and let callers guard.
- Memoize the context value with `useMemo` and callbacks with `useCallback` — a provider re-render otherwise re-renders every consumer.
- A context **never** calls a service or `api/` directly. It consumes hooks.

## Mounting the provider

When the whole route needs it, mount it in a sibling `layout.tsx` so `page.tsx` stays a Server Component:

```typescript
// app/user-management/(users-private)/users/layout.tsx
import { InvitationsSectionProvider } from '@/modules/user-management/users/components/(invitations)/InvitationsSectionContext';

export default function UsersLayout({ children }: { children: ReactNode }) {
  return <InvitationsSectionProvider>{children}</InvitationsSectionProvider>;
}
```

**Suspense:** a provider mounted in `layout.tsx` that reads `useSearchParams` (directly or through `use<Feature>QueryParams`) needs its own `<Suspense>` boundary **in that layout**. A boundary inside `page.tsx` cannot cover its layout ancestor, and `next build` will fail with `missing-suspense-with-csr-bailout`.

## Checklist

- [ ] Justified by sibling components sharing state that props cannot carry
- [ ] Co-located with its section, not in a top-level `context/`
- [ ] `'use client'` present
- [ ] Owns selection only — no filters, no pagination, no server data of its own
- [ ] Reads data via the module's React Query hook, same params as the page
- [ ] Consumer hook throws outside the provider
- [ ] Value and callbacks memoized
- [ ] Provider mounted in `layout.tsx` with its own `<Suspense>` if it reads search params
