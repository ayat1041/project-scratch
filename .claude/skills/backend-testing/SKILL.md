---
name: backend-testing
description: Cross-cutting — tests for apps/backend. Use when writing or running service tests, integration tests, or middleware tests. Covers the two runners (node:test via tsx, and Jest for integration), which one a file lands in, real-DB test hygiene, and the E2E boundary.
---

# Backend Testing

Two runners, split by folder. Getting the folder wrong means the test silently never runs.

| Runner | Selects | Command |
|---|---|---|
| `node:test` via `tsx` | every `*.test.ts` **except** those under `__integration__/` | `pnpm --filter backend test` |
| Jest (`ts-jest`) | only `**/integration/**/*.test.ts` | `pnpm --filter backend test:integration` |

```bash
pnpm --filter backend test                    # unit + service, node:test
pnpm --filter backend test:services           # *.service.test.ts only
pnpm --filter backend test:integration        # Jest, integration folders
pnpm --filter backend test:file -- update-api-key-name.service.test.ts
```

`test` and `test:services` run against a **real** local Postgres, Redis, and Qdrant — the connection strings are baked into the script. The stack must be up.

E2E API tests live in `apps/e2e-backend` (Playwright) and are outside this app's runners.

## Where a test file goes

| Testing | Location | Runner |
|---|---|---|
| A pure utility | co-located next to the utility | node:test |
| A service (real DB) | `<feature>/services/<action>.service.test.ts` | node:test |
| Middleware | next to the middleware, e.g. `csrf.middleware.test.ts` | node:test |
| DB/transaction-heavy or multi-module flow | `<feature>/tests/integration/*.test.ts` | Jest |
| Full HTTP request/response | `apps/e2e-backend` | Playwright |

Name test files to mirror their source, with `.test.ts`. For integration tests, keep the feature-scoped intent explicit in the filename.

## What to cover per layer

| Layer | Assert |
|---|---|
| Domain queries | Field selection matches what callers read; existence checks return `resourceId`/`userId`/`organizationId`/`data`; empty result on no match |
| Domain commands | The write lands; transaction rollback leaves no partial state |
| Services | Valid **and invalid** state transitions; DB state after the mutation; conflict and not-found paths; no re-fetch of resolved data |
| Policies | `allow()` / `deny()` for each `PolicyContext` shape — owner, non-owner, admin, cross-tenant |
| Validation schemas | Rejection message text (three apps render it), boundary values, coercion |
| Middleware | Auth guard, permission gate, resource resolution, and the failure statuses |
| Workers | Handler idempotency — running the same message twice; retry exhaustion path |

**Cover invalid transitions, not just happy paths.** A state machine that only has success tests is untested where it matters.

## Real-DB hygiene

- **Unique data per run.** Suffix with `Date.now()` or a UUID; a hardcoded email collides on the second run and produces a confusing failure.
- Assert DB state after a mutation, not just the return value — a service that returns the right object while writing the wrong row passes a return-value-only test.
- Keep tests independent. No ordering assumptions, no shared mutable fixture between files; `--test-concurrency=4` means they run in parallel.
- Clean up what you create, or scope it so leftovers cannot affect another test.

## Quality rules

- Deterministic and isolated. No reliance on wall-clock timing, no sleeps to "let the DB catch up".
- Feature-cohesive test files over one giant suite.
- No duplicate assertions across layers — if the service test already proves the transition, the integration test should prove the wiring, not repeat it.
- Cover auth (`401`), permission (`403`), success (`2xx`), and validation (`4xx`) at the E2E layer. Add at least one cross-tenant or unauthorized mutation attempt for any sensitive endpoint.

## Jest specifics

`jest.config.ts` maps `@/` to `src/`, and maps `@repo/constants` / `@repo/utilities` to package **source**, not `dist` — so integration tests see package changes without a rebuild. `@repo/utilities/security/dom-purify` is mocked from `__jestmocks__/`. `diagnostics: false` means ts-jest will not fail on type errors: **a type error will not surface here**, only in `pnpm --filter backend build`.

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Integration test outside an `integration/` folder | Jest never selects it — it silently does not run |
| Unit test placed under `integration/` | node:test skips it |
| Hardcoded emails/slugs in a real-DB test | Unique suffix per run |
| Asserting only the return value of a mutation | Assert DB state too |
| Happy-path-only state machine tests | Cover invalid transitions |
| `sleep`/timing assertions | Await the actual operation |
| Relying on Jest to catch type errors | `diagnostics: false` — use `build` |
| Tests that must run in a fixed order | Concurrency 4 breaks them |

## Checklist

- [ ] File is in the folder its runner selects
- [ ] Name mirrors the source file
- [ ] Local Postgres/Redis/Qdrant running for `test` / `test:services`
- [ ] Unique data per run
- [ ] DB state asserted after mutations
- [ ] Invalid transitions and error paths covered
- [ ] Policies tested for owner / non-owner / admin / cross-tenant
- [ ] No ordering dependencies
- [ ] `pnpm --filter backend build` passes (the real type gate)
- [ ] Relevant test command run, and its output reported honestly
