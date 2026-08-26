---
description: Generate or extend Jest + React Testing Library tests for a frontend module, layer by layer, with the right mock depth at each level.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Tests

## Step 1 — Resolve scope

Target is a module path (`user-management/user-preferences`), a single file, or — with no argument — the current branch diff under `apps/frontend/`. List the files in scope and which layer each belongs to.

## Step 2 — Required reading

- Skill `frontend-testids-and-testing`
- `.github/instructions/testing-frontend.instructions.md`
- The module's `utils/testids.ts`
- An existing test for style, if the module already has one — otherwise follow the per-layer table below

## Step 3 — Place the files

Mirror the module path:

```
apps/frontend/__tests__/features/<domain>/<feature>/<Name>.test.ts[x]
```

## Step 4 — Write per layer

| Layer | Assert | Mock |
|---|---|---|
| `utils/` | Pure functions directly — formatting, mapping, derivations, edge cases | nothing |
| `services/` | Zod rejection with the exact message; wire→domain mapping; query-string assembly; `ApiResponse` narrowing; orchestration order | the `api/` module |
| `handlers/` | `toast.success` uses `result.message`; on failure `handleErrorToast` is called **and** the promise rejects | the service, `sonner` |
| `hooks/` | Loading → success → error transitions; a query-key change refetches; a stale async response is discarded | the service |
| `components/` | Loading, empty, error, success renders; interaction calls the right handler with the right arguments | the handler / hook |
| Reducers, state machines | Directly, as pure functions | nothing |

**Always test the handler re-throw.** It is the most-broken rule in the codebase and a two-line test catches it.

## Step 5 — Required coverage

- Data-driven components: loading, error, **and** success
- Forms: valid submit, invalid submit, error rendering
- Routing-sensitive UI: navigation, redirect, auth-guard behavior
- Contract changes: update the tests that encode the old shape, in the same change

## Step 6 — Quality rules

- Assert what the user observes. Query by role and accessible name first; `getByTestId` with a constant from `utils/testids.ts` when there is no accessible handle. Never inline a raw testid string.
- Mock the layer directly beneath the one under test — never two layers down.
- `await screen.findBy...` / `waitFor` over fixed timers. No `setTimeout` assertions.
- One behavior per `it`; the name states the behavior.
- Fresh `QueryClient` per test with `retry: false`.
- Mock `next/navigation` (`useSearchParams`, `useRouter`) for URL-state components.

## Step 7 — Run

```bash
pnpm --filter frontend test -- <path>
pnpm --filter frontend test
```

## Step 8 — Report

- Test files created or extended, per layer.
- Behaviors covered.
- **Behaviors deliberately not covered, and why** — do not present partial coverage as complete.
- Test run output. If anything fails, say so with the output rather than describing it as passing.
