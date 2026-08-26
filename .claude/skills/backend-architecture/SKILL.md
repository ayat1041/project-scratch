---
name: backend-architecture
description: Entry point and router for any work inside apps/backend. Use before creating a module or feature, adding an endpoint, moving a file, or deciding where code belongs. Resolves the request lifecycle (B1 route → B7 database), the feature-first folder shape, the F-ID convention, layer boundaries, and points to the per-layer skill.
---

# Backend Architecture — Orientation

Scope: `apps/backend`. Express 5 + TypeScript + Drizzle + Postgres + Redis. Feature-first structure under `src/modules/`.

## The request lifecycle — never reorder

```
Request
  → isAuthenticated()     1. verify session, set res.locals.userId
  → hasPermission()       2. role-level permission gate, sets res.locals.has*Permission
  → resolveResources()    3. fetch + verify existence, sets res.locals.resourceData
  → authorize()           4. per-resource policy check using res.locals.resourceData
  → Controller            5. read pre-resolved data, call service
  → Service               6. mutate only — never re-fetch what step 3 already loaded
```

`resolveResources` is the **only** source of truth for fetched entities. Controllers never query the DB. Services never re-fetch what the controller already has.

## The layer stack

| # | Layer | Path | Skill |
|---|---|---|---|
| B1 | Route | `modules/<domain>/features/F<ID>-<name>/<feature>.routes.ts` | `backend-routes` |
| B2 | Auth chain + policies | `src/middleware/`, `src/policies/<domain>.policy.ts` | `backend-auth-and-policies` |
| B3 | Validation | `validations/<feature>.schema.ts`, `validation.middleware.ts` | `backend-validation` |
| B4 | Controller | `controllers/<action>-<resource>.controller.ts` | `backend-controllers` |
| B5 | Service | `services/<action>-<resource>.service.ts` | `backend-services` |
| B6 | Domain queries/commands | `src/domain/<domain>/<sub>/models/<resource>-queries.model.ts` | `backend-queries` |
| B7 | Database | `src/db/schema/`, `drizzle/` | `backend-database` |
| B8 | API docs | `swagger-docs/<action>.swagger.ts` | `backend-swagger` |
| B9 | Queues + workers | `src/workers/`, `src/constants/queues.ts` | `backend-workers` |

Cross-cutting: `backend-errors`, `backend-naming`, `backend-testing`, and `backend-list-endpoints` for every GET list endpoint.

## Folder shape

Features live under a domain module, prefixed with their feature ID:

```
src/modules/<domain>/features/F<NNNN>-<feature-name>/
├── <feature-name>.routes.ts          singleton at feature root
├── controllers/<action>-<resource>.controller.ts
├── services/<action>-<resource>.service.ts
├── validations/<feature>.schema.ts
├── swagger-docs/<action>.swagger.ts
├── types/                            only when shared contracts emerge
├── docs/                             frd / tdd / technical
└── tests/integration/
```

Domains in use: `auth`, `common`, `platform`, `user-management`. Feature IDs are allocated per domain — `F1xxx` auth, `F5xxx` common, `F6xxx` user-management, `F9xxx` platform. Reuse the existing series; never invent a new prefix without checking `src/modules/<domain>/`.

Shared, reusable data access lives **outside** the feature, in `src/domain/`:

```
src/domain/<domain>/<subdomain>/models/<resource>-queries.model.ts    read
src/domain/<domain>/<subdomain>/models/<resource>-commands.model.ts   write primitives
```

## Structure principles

- **Start minimal.** Create only the folders needed now. A single route file stays at feature root as `<feature>.routes.ts`; it moves into `routes/` only when there are several.
- Introduce a concern folder when there are 2+ files for it, when responsibilities are mixing, or when import churn shows poor separation. Not for visual symmetry.
- Always include `controllers`, `services`, `validations` once endpoint logic exists.
- Add `repositories` only for narrow single-aggregate data access, `policies` only for feature-local authorization rules, `types` only when a contract is genuinely shared.
- No empty placeholder folders.

## Layer boundaries

```
routes        compose the middleware chain and bind controllers — nothing else
controllers   request/response orchestration; read res.locals; no DB access
services      business logic and orchestration; mutate; no req/res/res.locals access
domain models reusable data access (queries read, commands write)
validations   Zod schemas and request-level validation types
types         shared non-validation contracts
```

Forbidden:

- DB reads or writes in a controller
- A service importing another service (lift the shared part into `domain/.../models/`)
- A service importing a policy, or calling one
- A service reading `req.params`, `req.body`, or `res.locals` — the controller passes what it needs as arguments
- A controller re-querying anything `resolveResources` already loaded

## Express 5 gotchas

- `req.params.id` is typed `string | string[]` — normalize to `string` in the controller before passing on.
- `req.query.*` is `string | string[] | ParsedQs` — coerce explicitly; never assume a number.
- Route wildcards use `{*}`, not `*`.
- `res.json()` sets `Content-Type` itself — do not set it manually.
- Async errors reach the error middleware natively; handlers are still wrapped in `asyncHandler` for explicitness.

## Zod 4 gotchas

- `ZodError.format()` changed shape in v4 — do not depend on the nested structure. Use `error.issues[0]?.message`.
- `z.object()` is closer to strict in some contexts — add `.passthrough()` explicitly when extra keys must survive.
- Prefer `z.discriminatedUnion()` over `z.union()` when a discriminant field exists.

## Commands

```bash
pnpm --filter backend dev              tsx watch src/server.ts
pnpm --filter backend build            tsc && tsc-alias  ← this IS the type-check
pnpm --filter backend lint             eslint --fix (mutates files)
pnpm --filter backend test             tsx --test, excludes __integration__
pnpm --filter backend test:integration jest
pnpm --filter backend test:services    *.service.test.ts only
pnpm --filter backend test:file -- <file.test.ts>
pnpm --filter backend db:generate      drizzle-kit generate
pnpm --filter backend db:migrate       drizzle-kit migrate
```

**There is no `check-types` script on backend.** `build` is the type gate — `pnpm --filter backend check-types` fails. Note that `lint` runs with `--fix`, so it rewrites files; run it before reviewing a diff, not after.

## Source-of-truth docs

| Doc | Covers |
|---|---|
| `.github/instructions/api-workflow.instructions.md` | Request lifecycle, route/policy/controller/service contracts |
| `.github/instructions/backend-file-structure.instructions.md` | Feature folder shape, refactor rules, doc conventions |
| `.github/instructions/get-list-service.instructions.md` | Every GET list endpoint |
| `.github/instructions/error-handling.instructions.md` | `createError`, `asyncHandler`, global middleware |
| `.github/instructions/backend-naming-conventions.instructions.md` | Files, variables, functions, types |
| `.github/instructions/backend-migrations.instructions.md` | Schema changes and migrations |
| `.github/instructions/api-documentation-guide.instructions.md` | Swagger/OpenAPI JSDoc |
| `apps/backend/SKILL.md` | Pinned stack versions and rediscovery-prone facts |

## Known doc drift — verified against the code

- `api-workflow.instructions.md` §5 suggests sharing types via `packages/types` and `packages/validations`. **Neither package exists.** The shared contract package is `@repo/schemas-types`; shared runtime values are `@repo/constants`.
- Docs list both `validation/` and `validations/` as the folder name; the tree has 6 `validations/` and 1 `validation/`. Use **`validations/`**.
- `backend-agents.instructions.md` and `AGENTS.md` mention a backend `check-types`; the script does not exist. Use `build`.
