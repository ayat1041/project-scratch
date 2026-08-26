---
description: "Backend and API-E2E testing standards."
applyTo: "{apps/backend,apps/e2e-backend}/**/*.test.ts"
---

# Testing Standards - Backend

## Runners

- `apps/backend`: `node:test` with `tsx`
- `apps/e2e-backend`: Playwright

## Backend Service Tests

- Use real DB/Redis for service tests where existing project patterns require it.
- Cover valid transitions and invalid transitions for stateful operations.
- Add DB assertions after mutation operations.
- Use unique data per test run (`Date.now()`/unique suffix) to avoid collisions.

## API E2E Tests

- Cover auth guard behavior (`401`), permission behavior (`403`), and success path (`2xx`).
- Cover validation failures (`4xx`) and response contract shape.
- Add at least one cross-tenant or unauthorized mutation attempt for sensitive endpoints.

## General Rules

- Keep tests deterministic and isolated.
- Prefer feature-cohesive test files.
- Avoid duplicate assertions across layers.
