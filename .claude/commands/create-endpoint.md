---
description: Create a new backend endpoint end-to-end (routes + middleware chain + controller + service + validations + swagger doc + tests).
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Agent
---

# Create Endpoint

## Step 1 — Gather inputs

Confirm in context (ask if missing):

- HTTP method + path
- Target module/feature (e.g. `user-management/roles`)
- Required permission(s)
- Resource(s) to resolve via `resolveResources`
- Request body / query / params shape
- Success response shape
- Any new error types

Stop and ask if any item above is missing.

## Step 2 — Required reading

Read before writing code:

- `.github/instructions/backend-agents.instructions.md`
- `.github/instructions/api-workflow.instructions.md`
- `.github/instructions/error-handling.instructions.md`
- `.github/instructions/backend-file-structure.instructions.md`
- `.github/instructions/backend-naming-conventions.instructions.md`
- `.github/instructions/api-documentation-guide.instructions.md`
- If GET-list: `.github/instructions/get-list-service.instructions.md`
- ADRs from `.github/instructions/backend-adrs.instructions.md` that touch the table being changed.

## Step 3 — Implement (delegate to `backend-implementer` agent if helpful)

Order of work:

1. Validation schema (zod) under `<feature>/validations/`.
2. Service under `<feature>/services/` — pure business logic; throw via `createError`.
3. Controller under `<feature>/controllers/` — wrapped in `asyncHandler`; reads `res.locals.resourceData`; normalizes `req.params.id` to string (Express 5).
4. Policy (if new permission scope) under `<feature>/policy.ts`.
5. `resolveResources` query in `<feature>/queries.model.ts` returning `ExistenceCheckResult<T>`.
6. Routes file with exact chain: `isAuthenticated -> hasPermission -> resolveResources -> authorize -> controller`.
7. Swagger doc under `<feature>/swagger-docs/<action>.swagger.ts` with concrete examples in `content.application/json.examples`.

## Step 4 — Tests

Delegate to `backend-test-author` agent or follow its rules:

- Integration test per service action in `<feature>/tests/integration/`.
- Success + each typed-error path + DB-state assertions.

## Step 5 — Verify

From `apps/backend`:

- `pnpm run build` (must pass).
- Visual check at `http://localhost:8000/api-docs` if backend is running.

## Step 6 — Report

- List files created/changed.
- Build result.
- Manual checks the user must run.
