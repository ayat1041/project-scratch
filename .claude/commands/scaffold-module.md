---
description: Scaffold a new backend feature folder per backend-file-structure.instructions.md (controllers/services/validations/tests/swagger-docs/routes).
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Scaffold Module

## Step 1 — Gather inputs

Confirm (ask if missing):

- Parent module (e.g. `user-management`)
- New feature name (kebab-case, e.g. `api-keys`)
- One-line purpose
- Initial actions to scaffold (create / get-single / list / update / delete — any subset)

## Step 2 — Required reading

- `.github/instructions/backend-file-structure.instructions.md`
- `.github/instructions/backend-naming-conventions.instructions.md`
- `.github/instructions/backend-agents.instructions.md`

## Step 3 — Generate the folder layout

Create under `apps/backend/src/modules/<module>/<feature>/`:

```
controllers/<feature>.controller.ts
services/<feature>.service.ts
validations/<feature>.schema.ts
swagger-docs/                    (empty — populate via /add-swagger-doc)
tests/integration/               (empty — populate via /generate-integration-tests)
<feature>.routes.ts              (singleton at feature root)
queries.model.ts                 (resolveResources queries)
policy.ts                        (authorization)
index.ts                         (re-exports for consumer wiring)
```

For each requested action, add a stub function in the controller and service that:

- Throws `createError.notImplemented(...)` until implemented.
- Has the correct signature shape (controller wrapped in `asyncHandler`, service async returning the expected row shape).

## Step 4 — Wire up

- Add the new router to the module's index/route aggregator.
- Add the new feature to `apps/backend/src/db/schema/index.ts` if it introduces schema (otherwise skip).

## Step 5 — Verify

- `pnpm run build` must pass.

## Step 6 — Report

- Files created.
- Next-step commands: `/create-endpoint`, `/add-swagger-doc`, `/generate-integration-tests`.
