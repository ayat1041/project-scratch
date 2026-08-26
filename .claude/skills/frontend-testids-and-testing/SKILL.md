---
name: frontend-testids-and-testing
description: Cross-cutting — utils/testids.ts and Jest tests for apps/frontend. Use when adding a data-testid, writing or reviewing a component/hook/service test, or deciding what to mock at which layer. Covers the testid contract shared with the E2E suite and per-layer test strategy.
---

# Test IDs and Testing

## `utils/testids.ts` — the module's testid contract

One file per module, the single source of every `data-testid` it renders. Grouped by UI region as `as const` objects. Components import the group; tests import the same constants; the Playwright E2E suite imports them too.

```typescript
// ─── Header Section ─────────────────────────────────────────────
export const API_KEY_HEADER = {
  ADD_BUTTON: 'api-key-header-add-button',
} as const;

// ─── Filter Section ─────────────────────────────────────────────
export const API_KEY_FILTER = {
  SEARCH_INPUT: 'api-key-filter-search-input',
  SCOPE_TRIGGER: 'api-key-filter-scope-trigger',
  SCOPE_OPTION_PREFIX: 'api-key-filter-scope-option-',
  CLEAR_BUTTON: 'api-key-filter-clear-button',
} as const;

// ─── Table Section ──────────────────────────────────────────────
export const API_KEY_TABLE = {
  SELECT_ALL_CHECKBOX: 'api-key-table-select-all-checkbox',
  ROW_CHECKBOX_PREFIX: 'api-key-table-row-checkbox-',
  LABEL_SAVE_BUTTON_PREFIX: 'api-key-table-label-save-button-',
} as const;
```

Rules:

- `SCREAMING_SNAKE_CASE` group name, scoped to the UI region: `<FEATURE>_<REGION>`.
- Value is kebab-case and mirrors the group: `api-key-filter-search-input`.
- Anything rendered per-row ends in `_PREFIX` and is concatenated with the id at the call site: `` `${API_KEY_TABLE.ROW_CHECKBOX_PREFIX}${row.id}` ``.
- `as const` always — without it the values widen to `string` and lose autocomplete at the assertion site.
- **Never inline a raw testid string in a component or a test.** A renamed testid must break the build, not the test run.
- Renaming a value is a cross-repo change: check `frontend-e2e-testing/` before changing one.

## Runner

Jest + React Testing Library. Tests live in `apps/frontend/__tests__/features/<domain>/<feature>/`, mirroring the module path.

```bash
pnpm --filter frontend test                     # all
pnpm --filter frontend test -- <path-or-name>   # one file
pnpm --filter frontend test:watch
```

## What to test at each layer

| Layer | Test | Mock |
|---|---|---|
| `utils/` | Pure functions directly — formatting, mapping, derivations | nothing |
| `api/` | Rarely worth a unit test; covered through the service | `fetch` |
| `services/` | Zod rejection, wire→domain mapping, query-string assembly, `ApiResponse` narrowing, orchestration order | the `api/` module |
| `handlers/` | `toast.success` copy comes from `result.message`; failure calls `handleErrorToast` **and** re-throws | the service, `sonner` |
| `hooks/` | Loading → success → error transitions, query key changes, race guard discards the stale response | the service |
| `components/` | Loading, empty, error, success renders; user interaction calls the right handler | the handler / hook |
| Reducers, state machines | Directly, as pure functions | nothing |

`apps/frontend` has no `__tests__/` tree yet. For a new module, mirror the module path under it: `__tests__/features/user-management/api-keys/api-key-table-reducer.test.ts` (pure), `invitations-eligibility.test.ts` (derivation), `__tests__/features/auth/signin/SignInForm.test.tsx` (component).

## Coverage expectations

- **Data-driven components** — loading, error, and success states, all three.
- **Forms** — valid submit, invalid submit, and error rendering.
- **Routing-sensitive UI** — navigation, redirect, and auth-guard behavior.
- **Shared contract changes** — update the tests that encode the old schema/type expectations in the same change.
- **Handlers** — the re-throw. It is the single most-broken rule in this codebase and a two-line test catches it.

## Quality rules

- Assert on what the user observes — rendered text, roles, enabled/disabled state — not on internal state or call counts, except when the call *is* the behavior (a handler invocation).
- Query by role and accessible name first; fall back to `getByTestId` with a constant from `utils/testids.ts` when there is no accessible handle.
- Keep mocks minimal and realistic. Mock the layer directly beneath the one under test, never two layers down.
- Prefer `await screen.findBy...` and `waitFor` over fixed timers. No `setTimeout` assertions.
- One behavior per `it`. The test name states the behavior, not the function name.

## Mocking recipes

```typescript
// service mocked for a handler test
jest.mock('../services/api-keys-service');
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

// React Query hook consumers need a fresh client per test — no retries, no cache bleed
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

// URL-state components need the search params they read
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('?search=&status=all&limit=10&offset=0'),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
```

## Checklist

- [ ] Every rendered testid comes from `utils/testids.ts`, `as const`, region-scoped
- [ ] Row-level ids use a `_PREFIX` constant plus the row id
- [ ] Test file mirrors the module path under `__tests__/features/`
- [ ] Data-driven components cover loading, error, and success
- [ ] Forms cover valid submit, invalid submit, error rendering
- [ ] Handler tests assert the re-throw
- [ ] Mocks stop at the layer directly beneath the one under test
- [ ] No fixed-timer assertions
- [ ] `pnpm --filter frontend test` passes
