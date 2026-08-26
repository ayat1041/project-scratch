---
name: admin-testids-and-testing
description: Cross-cutting — utils/testids.ts and Jest tests for apps/admin. Use when adding a data-testid, writing or reviewing a test for a dashboard table, filter, or destructive action, or deciding what to mock. Covers Server-Component Presenter testing and permission-sensitive UI.
---

# Admin Test IDs and Testing

Jest + React Testing Library. Tests live under `apps/admin/__tests__/`, mirroring the module path.

```bash
pnpm --filter admin test
pnpm --filter admin test -- <path-or-name>
pnpm --filter admin test:watch
```

Coverage today is thin — `__tests__/page.test.tsx` only, and `apps/frontend` currently has no tests either. Treat new tests as establishing the pattern rather than following a deep precedent, since the two apps share conventions.

## `utils/testids.ts`

One file per module, the single source of every `data-testid` it renders, grouped by UI zone as `as const` objects. None exist yet in `apps/admin` — add one the first time a module (e.g. `user-management/roles/`) needs testids.

```typescript
export const ROLE_TABLE = {
  ROW_PREFIX: 'role-table-row-',
  EXPAND_TOGGLE_PREFIX: 'role-table-expand-',
  DELETE_BUTTON_PREFIX: 'role-table-delete-',
} as const;
```

- `<MODULE>_<ZONE>` group name, kebab-case values mirroring it.
- Row-level ids end in `_PREFIX` and concatenate with the row id at the call site.
- `as const` always — without it values widen to `string` and lose autocomplete at the assertion site.
- **Never inline a raw testid string** in a component or a test. A rename must break the build, not the test run.

## What to test at each layer

| Layer | Test | Mock |
|---|---|---|
| `utils/`, `constants/` | Status normalization maps, formatters, derivations | nothing |
| `services/` | `searchParams` normalization (`string[]` and `undefined` cases); wire→domain transformers; `ApiResponse` narrowing; the status→backend map | the `api/` module |
| `handlers/` | `toast.success` uses `result.message`; failure calls `handleErrorToast` **and** re-throws | the service, `sonner` |
| `components/(table)/use<Entity>Table.ts` | Selection, dialog open/close, `router.refresh()` called on success, mutation handlers returning `boolean` | the handlers |
| `hooks/` | Shared dialog hook reused by a table and its detail page | the handlers |
| Client components | `(table)/index.tsx` and rows — populated, empty, error; interaction calls the right handler | the handler |
| `Presenter.tsx` | Server Component — test the **service** it calls, and test the composed zones separately | see below |

**Always test the handler re-throw.** It is the rule most easily lost, and its failure mode is an admin believing a deletion succeeded.

## Testing around a Server Component Presenter

`Presenter.tsx` is `async` and server-only, so it is not a normal RTL render target. Split the coverage instead:

- Test `getAll<Entities>(searchParams)` directly — that is where the logic lives.
- Test `(filter)/` and `(table)/` as ordinary components with props.
- Test the co-located `use<Entity>Table` hook directly: selection, dialog open/close, and that a successful mutation triggers `router.refresh()`.
- Cover the empty-versus-error distinction at the service level: a failed read must not be indistinguishable from an empty result.

Do not restructure a Presenter into a Client Component to make it testable.

## Required coverage

- **List/table pages** — empty, loading, error, and populated states.
- **Filters, sort, pagination** — query-state changes produce the expected result set. In admin these are `searchParams`, read server-side, so this is largely a service-level test.
- **Mutation flows** — success, validation error (422), and permission-denied (403).
- **Role-sensitive actions** — hidden, disabled, or blocked exactly as designed. An admin action that renders for a role that cannot perform it is a real bug, not a cosmetic one.

## Quality rules

- Behavior-focused assertions over implementation details. Query by role and accessible name first; `getByTestId` with a constant when there is no accessible handle.
- Mocks constrained to boundaries — network and time — not core rendering.
- `await screen.findBy...` / `waitFor` over fixed timers. No `setTimeout` assertions.
- One behavior per `it`; the name states the behavior.

## Mocking recipes

```typescript
jest.mock('../services/roles-service');
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams('?search=&sortBy=name&limit=10&offset=0'),
}));
```

Admin has no React Query today — reads are SSR through the Presenter, so no `QueryClientProvider` wrapper is needed and adding one signals a misread of the data path. If a screen adopts the shared live-table pattern, wrap it per the `nextjs-live-table-pattern` skill's test contract (fresh client per test, `retry: false`).

## Checklist

- [ ] Every rendered testid comes from `utils/testids.ts`, `as const`, zone-scoped
- [ ] Row-level ids use a `_PREFIX` constant plus the row id
- [ ] Test file mirrors the module path under `__tests__/`
- [ ] Table pages cover empty, error, and populated
- [ ] Empty and error are distinguishable, and that is asserted
- [ ] Mutation flows cover success, 422, and 403
- [ ] Role-sensitive actions verified hidden/disabled as designed
- [ ] Handler tests assert the re-throw
- [ ] Presenter logic tested through its service, not by converting it to a client component
- [ ] `pnpm --filter admin test` passes
