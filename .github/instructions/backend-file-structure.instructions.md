---
description: "Backend feature file/folder structure standards for creating new modules and refactoring existing ones."
applyTo: "apps/backend/src/modules/**"
---

# Backend Feature File And Folder Structure

## Scope

This instruction applies to backend feature modules under `apps/backend/src/modules/**`.

Use this as the default structure guide when:

- creating a new backend feature/module
- refactoring an existing backend feature/module

## Core Principle

Use a feature-first structure with pragmatic depth:

- Keep single files at feature root when they are the only file of that concern.
- Create a dedicated folder only when there are multiple related files, or when separation clearly improves maintainability.
- Do not keep empty placeholder folders long-term.

## Preferred Feature Shape

A feature should evolve toward this shape as needed:

- `routes/` or root route file
- `controllers/`
- `services/`
- `repositories/`
- `policies/`
- `validations/`
- `types/`
- `docs/` or `swagger-docs/`
- `tests/integration/`

Important:

- If there is only one route file, keep it at feature root (example: `feature.routes.ts`).
- If route files become multiple, move them into `routes/`.
- Same rule applies to `policies/`, `repositories/`, and `types/`.

## Mandatory Layer Boundaries

- `routes`: compose middleware chain and bind controllers only.
- `controllers`: request/response orchestration only.
- `services`: business logic orchestration.
- `repositories`: data access only (queries/commands, persistence operations).
- `validations`: zod schemas and request-level validation types.
- `types`: shared non-validation contracts for the feature.

Do not place direct DB writes/queries in controllers.

## Validation And Type Placement

Validation-local types are allowed in validation files.

- Keep `zod` schema + inferred type together when type usage is validation-scoped.
- Extract to `types/` only when a type is reused broadly across controllers/services/repositories or becomes a domain contract.

## Tests Structure

- Keep pure utility unit tests co-located with the utility file.
- Place service-level and DB/transaction-heavy tests in `tests/integration/`.
- Keep API E2E tests in `apps/e2e-backend`.

Naming:

- Use source-mirroring names with `.test.ts`.
- For integration tests, keep feature-scoped intent explicit in test file names.

## New Module Bootstrap Rules

When creating a new feature/module:

1. Start minimal: create only folders/files needed now.
2. Always include `controllers`, `services`, `validations` when endpoint logic exists.
3. Add `repositories` when data access is non-trivial or repeated.
4. Add `tests/integration` when service-level behavior exists.
5. Add `types` only when shared contracts emerge.
6. Add `policies` only when feature-local authorization rules are required.

## Refactor Rules For Existing Modules

Refactor incrementally, not as a big-bang rewrite.

1. Move one concern at a time (routes, then repositories, then tests, etc.).
2. Keep endpoint behavior unchanged unless explicitly requested.
3. Update imports immediately after each move.
4. Run backend build after each refactor slice.
5. Remove empty folders after successful migration.

## Trigger Points To Introduce A New Folder

Introduce a new concern folder when one or more conditions are true:

- there are 2+ files for that concern
- file size and cognitive load are growing
- responsibilities are mixed (for example service + persistence in same area)
- import churn indicates poor separation

## Documentation File Rules

Use these conventions for backend module/feature docs.

### Locations

- Module-level requirement/design docs live under:
  - `apps/backend/src/modules/<domain>/docs/`
- Feature implementation docs live under:
  - `apps/backend/src/modules/<domain>/features/<feature>/docs/technical/`

### Naming

- Use `kebab-case` for all doc filenames.
- Use descriptive noun phrases; avoid generic names like `new-doc.md` or `final.md`.
- Recommended module-level names:
  - `<feature-name>-frd.md`
  - `<feature-name>-tdd.md`
- Recommended feature-level technical names:
  - `<subject>.md` (for example: `role-permission-runtime.md`, `email-verification-state-machine.md`)

### When To Use `*-runtime.md`

Use `*-runtime.md` only for documentation of current, implemented runtime behavior.

- Include:
  - actual states/modes in code
  - real transition triggers (endpoints/jobs)
  - real DB tables/columns used
  - actual thrown errors and HTTP mappings
  - real side-effects and guard conditions
- Do not use `*-runtime.md` for:
  - planned architecture or future options
  - unimplemented design proposals
  - speculative migrations

Use `*-tdd.md` for planned implementation design decisions, and `*-frd.md` for business/feature requirements.

## Quick Refactor Checklist

- Middleware order remains unchanged for protected routes.
- Route mounting paths remain unchanged.
- Controller signatures and response shapes remain unchanged.
- Service behavior remains unchanged.
- Repositories contain persistence-only logic.
- Tests still pass and are correctly relocated.
- `pnpm --filter backend build` passes.

## Non-Goals

- Do not force folder creation for a single file.
- Do not introduce folders only for visual symmetry.
- Do not move files across features without a clear domain reason.
