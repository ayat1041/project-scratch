---
description: Generate or extend Jest + React Testing Library tests for an admin module, layer by layer, including Server-Component Presenter coverage and role-sensitive UI.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Admin Tests

## Step 1 — Resolve scope

A module path (`user-management/roles`), a single file, or — with no argument — the current branch diff under `apps/admin/`. List the files in scope and the layer each belongs to.

## Step 2 — Required reading

- Skill `admin-testids-and-testing`
- `.github/instructions/testing-admin.instructions.md`
- The module's `utils/testids.ts`

Admin test coverage is currently thin (`__tests__/page.test.tsx` only) — you are establishing the pattern, not following a deep precedent. Say so in the report rather than implying an existing convention.

## Step 3 — Place the files

```
apps/admin/__tests__/<domain>/<module>/<Name>.test.ts[x]
```

Mirror the module path.

## Step 4 — Write per layer

| Layer | Assert | Mock |
|---|---|---|
| `constants/`, `utils/` | Status normalization maps, formatters, derivations | nothing |
| `services/` | `searchParams` normalization for `string[]` and `undefined`; wire→domain transformers; `ApiResponse` narrowing; the status→backend map; **failure does not become an empty result** | the `api/` module |
| `handlers/` | `toast.success` uses `result.message`; failure calls `handleErrorToast` **and** re-throws | the service, `sonner` |
| `components/(table)/use<Entity>Table.ts` | Selection, dialog open/close, mutation handlers returning `boolean`, `router.refresh()` on success | the handlers |
| `hooks/` | Shared action-dialog hook reused by a table and its detail page | the handlers |
| `(table)/`, rows | Populated, empty, and error renders; interaction calls the right handler with the right args | the handler |
| `Presenter.tsx` | Not rendered directly — see Step 5 | — |

**Always test the handler re-throw.** In admin its failure mode is the worst one available: an admin believing a rejection succeeded.

## Step 5 — Testing around the Presenter

`Presenter.tsx` is `async` and server-only, so it is not a normal RTL render target. Split the coverage:

- Test `get<Entities>(searchParams)` directly — the logic lives there.
- Test `(filter)/` and `(table)/` as ordinary components with props.
- Assert that a failed read is **distinguishable from an empty one** at the service level.

Do not convert a Presenter into a Client Component to make it testable.

## Step 6 — Required coverage

- **List/table pages** — empty, loading, error, populated.
- **Filters, sort, pagination** — query-state changes produce the expected result; in admin this is mostly a service-level test since `searchParams` are read server-side.
- **Mutation flows** — success, validation error (422), permission denied (403).
- **Role-sensitive actions** — hidden, disabled, or blocked exactly as designed. An action rendered for a role that cannot perform it is a real bug.
- **Destructive actions** — the confirm dialog gates the handler call.

## Step 7 — Quality rules

- Behavior-focused assertions; query by role and accessible name first, `getByTestId` with a constant from `utils/testids.ts` otherwise. Never inline a raw testid.
- Mocks constrained to boundaries — network and time — not core rendering.
- `await screen.findBy...` / `waitFor` over fixed timers.
- One behavior per `it`; the name states the behavior.
- **No `QueryClientProvider`** — admin has no React Query today; its reads are SSR through the Presenter. Adding a provider signals a misread of the data path. If a screen ever does adopt the live-table pattern, wrap it exactly as `apps/frontend` does.

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams('?status=all&limit=10&offset=0'),
}));
```

## Step 8 — Run

```bash
pnpm --filter admin test -- <path>
pnpm --filter admin test
```

## Step 9 — Report

- Test files created or extended, per layer.
- Behaviors covered.
- **Behaviors deliberately not covered, and why** — do not present partial coverage as complete.
- Test run output. If anything fails, say so with the output rather than describing it as passing.
