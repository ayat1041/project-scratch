# AGENTS.md

Repository-wide operating instructions for AI coding agents working in this monorepo.

## Quick Commands (Use These First)

- Install deps: `pnpm install`
- Start backend (from `apps/backend`):
  - `sudo docker compose -f docker-compose.dev.yml -p starter-api-dev up`
- Start frontend (from `apps/frontend`): `pnpm run dev`
- Start admin (from `apps/admin`): `pnpm run dev`
- Build all workspaces: `pnpm build`
- Lint all workspaces: `pnpm lint`
- Type-check all workspaces: `pnpm check-types`
- Format repo files: `pnpm format`

Backend verification after backend changes:

- From `apps/backend`: `pnpm run build` (catches TypeScript/type errors)

When working on a single workspace, prefer scoped commands, for example:

- `pnpm --filter frontend dev`
- `pnpm --filter admin lint`
- `pnpm --filter backend build`

## Monorepo Context

- Package manager: `pnpm@9`
- Task runner: `turbo`
- Node.js: `>=18`
- Workspaces:
  - `apps/backend` (Express + TypeScript + Drizzle/PostgreSQL)
  - `apps/frontend` (Next.js 15 + React 19)
  - `apps/admin` (Next.js 15 + React 19)
  - `packages/*` shared libraries (`ui`, `validations`, `constants`, `utilities`, `styles`, configs)

## How To Work

1. Understand impact first (which app/package is affected).
2. Make the smallest correct change.
3. Run validation for touched scope before finishing:
   - minimum: lint + type-check
   - add build when change can affect runtime or exports
4. Keep imports/exports and workspace references consistent.

## Project Standards

- Use existing workspace conventions and patterns; do not introduce new architecture without clear need.
- Prefer shared packages over copy-pasting logic across apps.
- Keep public package exports stable; if changed, update all consumers in the same change.
- Favor strict typing; avoid `any` unless unavoidable and documented inline.
- Do not add new dependencies unless necessary; prefer existing repo dependencies first.

## Boundaries

- Never commit secrets, tokens, or credentials.
- Never edit generated/vendor/build outputs unless the task explicitly requires it.
- Never perform destructive git/file operations (`reset --hard`, mass deletes) unless explicitly requested.
- Ask before:
  - changing CI/CD pipelines, deployment config, or environment contracts
  - destructive database operations or irreversible migrations
  - large cross-workspace refactors

## Validation Checklist (Before Finalizing)

Run what matches your change scope:

- `pnpm lint`
- `pnpm check-types`
- `pnpm build`

If one app/package is changed, prefer filtered commands to reduce cycle time, then run broader checks when risk is cross-cutting.

## Additional References

- Workflow and setup: `README.md`
- Branch/release process: `/docs/branching-strategy.md`
- Monitoring/observability context: `docs/monitoring-system.md`
- AI setup guide (how the instructions / agents / prompts / hooks fit together, and how to use them in chat): `docs/ai-setup-guide.md`

## AI Tooling Map (Read When Relevant)

This repo's AI setup is Claude Code: agents/commands/skills under `.claude/`, plus rule files under `.github/instructions/*.instructions.md` that `CLAUDE.md` files `@`-import.

Nested `AGENTS.md` files (repo-wide context for any agent, mirrors the `CLAUDE.md` import chain):

- `apps/backend/AGENTS.md`
- `apps/backend/drizzle/AGENTS.md` → migrations rules
- `apps/backend/scripts/AGENTS.md` → scripts rules
- `apps/backend/src/modules/AGENTS.md` → feature folder layout + middleware chain
- `apps/backend/src/db/schema/AGENTS.md` → schema conventions
- `apps/frontend/AGENTS.md`, `apps/admin/AGENTS.md`

Skills (on-demand reference cards — read when entering a domain):

- `apps/backend/SKILL.md` — backend stack quick reference (Express 5, Zod 4, lifecycle, test pattern)
- `drizzle-master/SKILL.md` — Drizzle workflows
- `.claude/skills/*` — full layered architecture reference per app (see `.claude/commands` for the matching slash commands)

Hooks + CI:

- `apps/backend/.husky/pre-commit` — lint-staged + grep guard against `handleError(` / manual error responses + `tsc --noEmit` for staged backend TS
- `apps/backend/.husky/commit-msg` — commitlint against `apps/backend/commitlint.config.js`
- `.github/workflows/backend-ci.yml` — lint + type-build on PRs

## Pinned Backend Facts (Quick Reference)

- Stack: Express **5**, Zod **4**, TypeScript 5.9, Drizzle ORM 0.38.
- Express 5: `req.params.id` is `string | string[]` — normalize to string in controllers. `req.query.*` is `string | string[] | ParsedQs` — parse explicitly.
- Middleware order (protected endpoints): `isAuthenticated -> hasPermission -> resolveResources -> authorize -> controller`.
- Controllers read `res.locals.resourceData`; services mutate. Never re-fetch what `resolveResources` loaded.
- Errors: wrap with `asyncHandler`, throw via `createError.*`. `handleError(` is deprecated and blocked by pre-commit.
- DB: `app_` table prefix; UUID PKs; `createdAt`/`updatedAt`. Migrations only via `pnpm run db:generate` — never hand-edit `drizzle/migrations/*.sql`.
- Tests: integration tests use `node:test` + tsx + real DB; one file per service action under `<feature>/tests/integration/`; `uid()` for unique fields; `await closeDbPool()` in `after`.
- Verification: `cd apps/backend && pnpm run build` after every backend change.

Keep this file concise and global. Put app/package-specific instructions in local `AGENTS.md` files under that subtree.
