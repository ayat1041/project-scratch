---
description: "Serial index of the backend skills and slash commands, one per architecture layer from the route entry down to the database. Says which skill governs each layer, which command builds it, and the order to run them in."
applyTo: "apps/backend/**"
---

# Backend Commands & Skills — Layer by Layer

> **Scope:** `apps/backend`. Frontend equivalent: `apps/frontend/instructions/frontend-commands-and-skills.instructions.md`. Cross-surface map: `.github/instructions/commands-and-skills-map.instructions.md`.

Skills live in `.claude/skills/<name>/SKILL.md` and load automatically when their subject comes up. Commands live in `.claude/commands/<name>.md` and are invoked as `/<name>`.

---

## The layer stack

| # | Layer | Path | Skill | Command |
|---|---|---|---|---|
| B1 | Route | `modules/<domain>/features/F<ID>-<name>/<feature>.routes.ts` | `backend-routes` | `/create-endpoint` |
| B2 | Auth chain + policies | `src/middleware/`, `src/policies/<domain>.policy.ts` | `backend-auth-and-policies` | `/backend-policy` |
| B3 | Validation | `validations/<feature>.schema.ts` | `backend-validation` | *(part of `/create-endpoint`)* |
| B4 | Controller | `controllers/<action>-<resource>.controller.ts` | `backend-controllers` | `/create-endpoint` |
| B5 | Service | `services/<action>-<resource>.service.ts` | `backend-services` | `/create-endpoint` |
| B6 | Domain queries/commands | `src/domain/<domain>/<sub>/models/` | `backend-queries` | `/backend-query` |
| B7 | Database | `src/db/schema/`, `drizzle/` | `backend-database` | `/db-change` |
| B8 | API docs | `swagger-docs/<action>.swagger.ts` | `backend-swagger` | `/add-swagger-doc` |
| B9 | Queues + workers | `src/workers/`, `src/constants/queues.ts` | `backend-workers` | `/backend-worker` |

Cross-cutting:

| Aspect | Skill | Command |
|---|---|---|
| Errors — `createError`, `asyncHandler`, status map | `backend-errors` | — |
| Naming — files, symbols, DB objects | `backend-naming` | — |
| Every GET list endpoint | `backend-list-endpoints` | — |
| Tests — two runners | `backend-testing` | `/generate-tests`, `/generate-integration-tests`, `/run-tests` |
| Orientation, lifecycle, folder shape | `backend-architecture` | `/backend-plan-feature` |

---

## The request lifecycle — the rule everything else hangs off

```
isAuthenticated() → hasPermission() → resolveResources() → authorize() → Controller → Service
```

- `resolveResources` is the **only** source of fetched entities.
- Controllers read `res.locals.resourceData` and **never query**.
- Services mutate and **never re-fetch** what the controller already has.
- Eligibility/status filtering happens in the **controller**, in memory — a policy answers "may you", not "does the state allow it".

---

## Per layer — what governs it and what it must never do

### B7 — Database · `backend-database` · `/db-change`
Drizzle schema is the source of truth; SQL is generated. `app_` prefix, UUID PKs, timestamps, exports synced in `index.ts`.
**Never:** hand-edit generated SQL or `meta/`, delete an applied migration, `db:push` for a change that ships, apply a migration without reading the SQL, or run a destructive operation without asking.

### B6 — Domain queries/commands · `backend-queries` · `/backend-query`
Reusable data access. `-queries.model.ts` reads, `-commands.model.ts` write primitives. Existence checks feed `resolveResources` and select exactly what the controller and policy need.
**Never:** import from `modules/`, throw HTTP errors, orchestrate several writes, or `select *`.

### B5 — Services · `backend-services` · `/create-endpoint`
Coordinates one use-case: validate state, transition, write, queue, log. Plain arguments in.
**Never:** re-fetch resolved data, import another service, import a policy or controller, read `req`/`res`/`res.locals`, publish to a queue inside a transaction, or use `handleError`.

### B4 — Controllers · `backend-controllers` · `/create-endpoint`
`asyncHandler`-wrapped. Reads `res.locals.resourceData`, filters eligibility in memory, calls one service, returns `{ success, message, data }`.
**Never:** query the DB, `try/catch`, read `userId` from `req.body`, use an unnormalized `req.params.x`, or hand-shape a response.

### B3 — Validation · `backend-validation`
Zod 4. Client-facing schemas live in `@repo/schemas-types`; backend-only ones in `validations/`. Every rule carries an explicit message.
**Never:** rely on `ZodError.format()` structure, use `import type` on a runtime schema, pass raw `req.query` into a query builder, or map a validation failure to 400 (it is 422).

### B2 — Auth + policies · `backend-auth-and-policies` · `/backend-policy`
Existence functions supply the facts; policies decide permission from `PolicyContext` alone.
**Never:** query the DB inside a policy, use a permission string literal, or pass an `authorize` action name that is absent from the policy object — that fails at runtime, not build.

### B1 — Routes · `backend-routes` · `/create-endpoint`
Compose the chain, bind a controller. Bulk body routes use a flat path and `{ source: "body" }`.
**Never:** reorder the middleware chain, add a redundant owner id to the URL when the resource carries it, or mount a router where a `:param` segment will capture it.

### B8 — Swagger · `backend-swagger` · `/add-swagger-doc`
One JSDoc file per action. Full mounted path, exact sibling tag, realistic examples, only the statuses this endpoint returns.
**Never:** document in a later commit than the endpoint.

### B9 — Workers · `backend-workers` · `/backend-worker`
Queue names are a durable wire contract. Handlers are idempotent and honour `MAX_RETRY_COUNT`.
**Never:** rename a live queue in place, publish inside a transaction, ack before the work is durable, or omit `import "module-alias/register"` as the first line.

---

## Workflow

### A new feature, end to end

```
/backend-plan-feature      feature ID, layers, endpoint→layer map, build order
        ↓
packages/                  schemas, response types, constants, permissions
        ↓  GATE: pnpm --filter @repo/schemas-types build
/db-change                 schema → db:generate → REVIEW SQL → db:migrate
        ↓
/scaffold-module           feature folder + stubs
        ↓
/backend-query             existence fns, domain queries/commands
        ↓
/backend-policy            policy actions + permission wiring
        ↓
/create-endpoint           one endpoint at a time (route + validation + controller + service)
        ↓
/backend-worker            queue + consumer, if async work is in scope
        ↓
/add-swagger-doc
        ↓
/generate-tests  or  /generate-integration-tests
        ↓
/backend-audit  →  /backend-verify  →  /spec-sync <feature>
```

### Adding one endpoint to an existing feature

```
packages/ (if the shape is new) → /backend-query → /backend-policy (if needed)
   → /create-endpoint → /add-swagger-doc → /generate-tests
   → /backend-audit → /backend-verify
```

### Before merge

```
/backend-audit → /backend-verify → /review-impact → /spec-sync → backend-reviewer agent → /commit
```

---

## Command reference

| Command | Purpose | New? |
|---|---|---|
| `/backend-plan-feature` | Allocate the feature ID, decide layers, emit the build order | ✅ |
| `/scaffold-module` | Create the feature folder and stubs | existing |
| `/db-change` | Schema change + Drizzle migration | existing |
| `/backend-query` | Domain query/command, existence check | ✅ |
| `/backend-policy` | Policy action + permission wiring | ✅ |
| `/create-endpoint` | Route + controller + service + validation + tests + docs | existing |
| `/backend-worker` | Queue, routing key, publisher, consumer | ✅ |
| `/add-swagger-doc` | Create or update API docs | existing |
| `/generate-tests` | TDD-gated tests | existing |
| `/generate-integration-tests` | Lightweight integration tests | existing |
| `/run-tests` | Run a test file locally | existing |
| `/generate-technical-doc` | Feature runtime docs | existing |
| `/backend-audit` | Lifecycle + layer + anti-pattern audit | ✅ |
| `/backend-verify` | Full gate: builds, tests, spec-drift, manual checks | ✅ |
| `/review-impact` | Blast radius of changed files | existing |
| `/spec-sync` | Reconcile FRD/TDD with the implementation | existing |
| `/commit` | Conventional commit message | existing |

Repo-wide spec chain (not backend-specific): `/generate-lovable-frd` → `/generate-frd` → `/generate-tdd` → `/generate-issues`.

Agents: `backend-implementer`, `backend-reviewer`, `backend-test-author`, `backend-doc-writer`, `backend-migration-author`.

---

## Verification gate

```bash
pnpm --filter @repo/schemas-types build   # if packages/ changed
pnpm --filter backend build               # tsc && tsc-alias — the ONLY type gate
pnpm --filter backend lint                # eslint --fix — REWRITES FILES
pnpm --filter backend test                # node:test — needs local Postgres/Redis/Qdrant
pnpm --filter backend test:integration    # Jest — integration/ folders only
pnpm --filter backend check:spec-drift
```

---

## Known doc drift — verified against the code

| Doc says | Reality |
|---|---|
| `pnpm --filter backend check-types` | **No such script.** `build` is the type gate |
| Share types via `packages/types` / `packages/validations` (`api-workflow` §5, `get-list-service` §1) | **Neither package exists** and neither is imported. Use `@repo/schemas-types` and `@repo/constants` |
| `paginationQuerySchema` from `@repo/validations` | It is in `@repo/schemas-types/payload-schemas/common/` |
| Folder is `validation/` | 6 features use `validations/`, 1 uses the singular. Use **`validations/`** |

Two behaviours worth remembering because they fail silently: `lint` rewrites files (`--fix`), and Jest runs with `diagnostics: false`, so **a type error in a test surfaces only in `build`**.
