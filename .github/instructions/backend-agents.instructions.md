---
description: "Core operating rules for the backend: middleware order, controller/service patterns, DB rules, naming, endpoint change checklist, and validation commands. Auto-injected for all backend files."
applyTo: "apps/backend/**"
---

# Backend Agent Instructions

> **Loaded by:** `apps/backend/CLAUDE.md` (via `@`-import) and the nested `AGENTS.md` files under `drizzle/`, `scripts/`, `src/modules/`, and `src/db/schema/`. See `docs/ai-setup-guide.md` for the full map.

## Technology Stack & Versions

These are the **exact versions in use**. When generating or reviewing code, use the API for these versions — not older defaults from training data.

| Package          | Version   | Critical notes                            |
| ---------------- | --------- | ----------------------------------------- |
| `express`        | `^5.0.1`  | **Express 5** — not Express 4. See below. |
| `@types/express` | `^5.0.0`  | Express 5 types                           |
| `typescript`     | `5.9.2`   |                                           |
| `drizzle-orm`    | `^0.38.3` |                                           |
| `drizzle-kit`    | `^0.30.1` |                                           |
| `zod`            | `^4.1.12` | **Zod 4** — not Zod 3. See below.         |
| `pg`             | `^8.13.1` |                                           |
| `redis`          | `^4.7.0`  |                                           |
| `tsx`            | `^4.19.2` |                                           |

When uncertain about an API shape, read `apps/backend/package.json` to confirm the version, then use the correct API for that version.

### Express 5 — What Changed From Express 4

The LLM default is Express 4 patterns. This project uses **Express 5**. Key differences:

- **Async errors are caught automatically** — rejected promises in route handlers propagate to the error middleware without `try/catch`. The project still wraps handlers in `asyncHandler` for explicit clarity, but Express 5 does this natively.
- **`res.query` values are always strings** — `req.query.page` is `string | string[] | ParsedQs`, not a number. Always parse explicitly.
- **Path parameter syntax changed** — wildcards use `{*}` not `*`. Named params still use `:param`.
- **`app.router` is removed** — use `express.Router()` only.
- **`res.json()` sets `Content-Type` strictly** — no need to set it manually.
- **`next()` type** — `NextFunction` is unchanged, but passing a non-Error to `next()` that isn't a string "route"/"router" is a type error in v5 types.

### Zod 4 — What Changed From Zod 3

The LLM default is Zod 3 patterns. This project uses **Zod 4**. Key differences:

- **`z.string().email()` and similar** — API is mostly the same but error message format changed.
- **`z.object()` is strict by default** in some contexts — use `.passthrough()` explicitly if extra keys should be allowed.
- **`z.infer<typeof schema>`** — unchanged, still the correct pattern.
- **`.parse()` throws, `.safeParse()` returns `{ success, data, error }`** — unchanged.
- **`z.union()` performance** — improved; prefer `z.discriminatedUnion()` when discriminant field exists.
- **`ZodError.format()`** — output shape changed slightly in v4. Do not rely on the exact nested structure of `.format()` output.
- **`z.coerce`** — behavior is the same as v3 but stricter TypeScript types.

---

## Runtime And Validation Commands

- Start backend (from `apps/backend`): `sudo docker compose -f docker-compose.dev.yml -p starter-api-dev up`
- Build backend (type-safety gate): `pnpm run build`
- Lint backend: `pnpm run lint`
- DB migration generation (from `apps/backend`): `pnpm run db:generate`

After backend code changes, run at minimum:

- `pnpm run build`

## Source Of Truth Docs

Read these before changing related areas:

- Endpoint lifecycle and middleware chain: `.github/instructions/api-workflow.instructions.md`
- Naming conventions: `.github/instructions/backend-naming-conventions.instructions.md`
- File/folder structure rules: `.github/instructions/backend-file-structure.instructions.md`
- Error handling architecture pattern: `.github/instructions/error-handling.instructions.md`
- GET list service pattern: `.github/instructions/get-list-service.instructions.md`
- API docs/Swagger standards: `.github/instructions/api-documentation-guide.instructions.md`, `apps/backend/docs/swagger-integration.md`, `apps/backend/docs/swagger-setup-complete.md`
- Feature-level technical docs standard: `apps/backend/docs/instructions/technical-doc-guide.instructions.md`

## Non-Negotiable Backend Rules

- Middleware order for protected endpoints must be:
  `isAuthenticated -> hasPermission -> resolveResources -> authorize -> controller`
- `resolveResources` is the source of truth for fetched entities.
- Controllers read from `res.locals.resourceData` and prepare inputs.
- Services perform mutations/business logic; do not re-fetch data already resolved upstream.
- Use `asyncHandler` and throw errors; do not manually format error responses in controllers/services.
- Use `createError` helpers from `@/middleware/error.middleware` for typed errors.
- Keep global error middleware as the final middleware in app setup.

## API Documentation Requirements

For every new or changed endpoint:

- Update/create module `swagger-docs.ts` with OpenAPI JSDoc.
- Include accurate request and response schemas.
- Add concrete response examples in `content.application/json.examples` (or `example`), not only field-level examples.
- Reuse shared schemas via `$ref` when appropriate.
- Verify docs at `http://localhost:8000/api-docs` when backend is running.

## Database Rules (Backend)

When touching schema/relations/migrations in `apps/backend`:

- Read first:
  - `drizzle-master/references/schema-overview.md`
  - `drizzle-master/references/workflows.md`
- Follow conventions:
  - Table names must use `app_` prefix.
  - Use UUID primary keys and `createdAt`/`updatedAt` timestamps.
- Generate and review migrations from `apps/backend`:
  - `pnpm --filter backend db:generate`
- Keep schema exports in sync (for example `src/db/schema/index.ts`).
- Review generated migration SQL before applying.
- Do not perform destructive/irreversible DB operations unless explicitly requested.

## Naming And Structure Rules

- Use entity-first kebab-case file naming and role suffixes from `.github/instructions/backend-naming-conventions.instructions.md`.
- Use feature-first, pragmatic folder structure from `.github/instructions/backend-file-structure.instructions.md`.
- Use descriptive `camelCase` for variables/functions and `SCREAMING_SNAKE_CASE` for module constants.
- Keep new files in established backend structure (`modules`, `domain`, `policies`, `middleware`, etc.).

## Endpoint Change Checklist

- Implement middleware chain in the required order.
- Add/update existence query function with `ExistenceCheckResult<T>` signature.
- Ensure policy context fields are sufficient for authorization.
- Keep controller logic based on pre-resolved resource data.
- Keep service free from redundant existence/status re-queries.
- Update Swagger docs for the endpoint.
- Run `pnpm run build` before finalizing.
