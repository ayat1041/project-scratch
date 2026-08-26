---
description: "Rules for editing Drizzle schema and generated SQL migrations in apps/backend/drizzle. Auto-injected for all migration files."
applyTo: "apps/backend/drizzle/**"
---

# Backend Migrations Instructions

## Hard Rules

- **Never hand-edit generated SQL files** under `apps/backend/drizzle/migrations/*.sql`. They are produced from the schema via `pnpm run db:generate` and must stay in sync with the schema source.
- If a migration is wrong, fix the source schema in `apps/backend/src/db/schema/**` and **regenerate**:
  - From `apps/backend`: `pnpm run db:generate`
- Never delete or rename an already-applied migration. Add a new migration that corrects state instead.
- Never edit anything inside `drizzle/migrations/meta/` by hand.

## Required Reading Before Schema Changes

- `drizzle-master/SKILL.md`
- `drizzle-master/references/schema-overview.md`
- `drizzle-master/references/workflows.md`

## Schema Conventions

- Table names use the `app_` prefix.
- Use UUID primary keys and `createdAt`/`updatedAt` timestamps.
- Keep schema exports in sync (`apps/backend/src/db/schema/index.ts`).
- Prefer relations declared via `relations()` over ad-hoc joins in queries.
- Partial/unique/composite indexes that encode business invariants must be reflected in an ADR (see `apps/backend/docs/adr/`).

## Migration Workflow

1. Edit the schema in `apps/backend/src/db/schema/**`.
2. Run `pnpm --filter backend db:generate`.
3. Open the new SQL file under `apps/backend/drizzle/migrations/` and review the diff:
   - No unintended `DROP COLUMN` / `DROP TABLE`.
   - No data loss for production tables.
   - Constraint names are stable.
4. Commit the schema change and the generated SQL together.

## Destructive Change Policy

- Do not perform destructive or irreversible DB operations unless the user explicitly requests them.
- For column renames, prefer add-new-then-backfill-then-drop migrations across releases rather than in-place renames.
