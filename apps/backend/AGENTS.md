# AGENTS.md (apps/backend scope)

Local commands and pointers for the backend app. **Normative rules** live in
[.github/instructions/backend-agents.instructions.md](../../.github/instructions/backend-agents.instructions.md)
and are auto-injected for every file under `apps/backend/**`. Do not duplicate rules here.

> This `AGENTS.md` and `CLAUDE.md` (via `@`-import) both point at the same `.github/instructions/*.instructions.md` files. Nested `AGENTS.md` files under `drizzle/`, `scripts/`, `src/modules/`, and `src/db/schema/` extend this map for path-scoped rules.

## Pinned Facts (Quick Reference)

- Stack: Express **5** (`^5.0.1`), Zod **4** (`^4.1.12`), TypeScript 5.9, Drizzle ORM 0.38.
- Express 5: `req.params.id` is `string | string[]` — normalize to string in controllers; `req.query.*` is `string | string[] | ParsedQs` — parse explicitly.
- Middleware chain (protected endpoints): `isAuthenticated -> hasPermission -> resolveResources -> authorize -> controller`.
- Controllers read `res.locals.resourceData`; never query DB. Services mutate; never re-fetch resolved data.
- Errors: wrap with `asyncHandler`, throw via `createError.*` from `@/middleware/error.middleware`. `handleError(` is deprecated and blocked by the pre-commit hook.
- DB: `app_` table prefix, UUID PKs, `createdAt`/`updatedAt`. Migrations only via `pnpm run db:generate` — never hand-edit `drizzle/migrations/*.sql` or `meta/`.
- Tests (integration): `node:test` + tsx + real DB. One file per service action under `<feature>/tests/integration/`. `uid()` for unique fields. `await closeDbPool()` in `after`. Assert thrown errors via `ERROR_TYPES.*` predicate.

## Local Commands

- Start (dev): `sudo docker compose -f docker-compose.dev.yml -p starter-api-dev up`
- Build (type-safety gate): `pnpm run build`
- Lint: `pnpm run lint`
- DB migration generate: `pnpm run db:generate`

After backend code changes, run at minimum: `pnpm run build`.

## Required Reading (Source-of-Truth Map)

Auto-injected (no action needed):

- `.github/instructions/backend-agents.instructions.md` — non-negotiable backend rules
- `.github/instructions/api-workflow.instructions.md` — endpoint lifecycle
- `.github/instructions/api-documentation-guide.instructions.md` — swagger standards
- `.github/instructions/backend-file-structure.instructions.md` — module/folder layout
- `.github/instructions/backend-naming-conventions.instructions.md` — file/var/const naming
- `.github/instructions/error-handling.instructions.md` — asyncHandler + createError
- `.github/instructions/get-list-service.instructions.md` — GET list pattern
- `.github/instructions/testing-backend.instructions.md` — test layers
- `.github/instructions/backend-migrations.instructions.md` — drizzle/migrations rules
- `.github/instructions/backend-scripts.instructions.md` — scripts/ rules
- `.github/instructions/backend-adrs.instructions.md` — ADR pointer map

On-demand (read when relevant):

- `apps/backend/docs/instructions/technical-doc-guide.instructions.md`
- `apps/backend/docs/instructions/api-documentation-guide.instructions.md`
- `apps/backend/docs/instructions/frd-creation.instructions.md`
- `apps/backend/docs/instructions/github-issue-generation.instructions.md`
- `apps/backend/docs/swagger-integration.md`, `swagger-setup-complete.md`
- `apps/backend/docs/error-handling-migration.md`
- `apps/backend/docs/session-auth-flow.md`
- `apps/backend/docs/adr/*.md`
- `drizzle-master/SKILL.md`
- `apps/backend/SKILL.md` — backend stack quick-reference skill
