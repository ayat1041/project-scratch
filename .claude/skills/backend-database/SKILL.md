---
name: backend-database
description: Layer B7 — Drizzle schema and SQL migrations for apps/backend. Use when adding or changing a table, column, index, or relation, and when generating or reviewing a migration. Covers the app_ prefix, the never-hand-edit rule, the destructive-change policy, and the schema-to-entity-type flow.
---

# B7 — Database Schema and Migrations

Source of truth is `apps/backend/src/db/schema/**`. SQL under `apps/backend/drizzle/migrations/` is **generated from it** and is never authored by hand.

## Hard rules

- **Never hand-edit generated SQL** in `drizzle/migrations/*.sql`, and never touch anything in `drizzle/migrations/meta/`. If a migration is wrong, fix the schema source and regenerate.
- **Never delete or rename an applied migration.** Add a new one that corrects the state.
- **Never perform a destructive or irreversible operation unless the user explicitly asks.** Surface it and wait; do not apply silently.
- For column renames, prefer add-new → backfill → drop across releases over an in-place rename.

## Schema conventions

- Table names carry the `app_` prefix.
- UUID primary keys, plus `createdAt` / `updatedAt` timestamps.
- Keep `src/db/schema/index.ts` exports in sync when adding or renaming a table — a missing export silently breaks `entity-types`.
- Prefer relations declared via `relations()` (in `relations.ts`) over ad-hoc joins scattered through queries.
- Partial, unique, or composite indexes that encode a **business invariant** must be recorded in an ADR under `apps/backend/docs/adr/` (see `.github/instructions/backend-adrs.instructions.md`).

Schema folders: `user-management/`, `common-tables/`. Add a new domain folder (e.g. `platform-tables/`) when a table doesn't fit an existing one.

## Migration workflow

```bash
# 1. Edit apps/backend/src/db/schema/**
# 2. Generate
pnpm --filter backend db:generate

# 3. REVIEW the new SQL file under apps/backend/drizzle/migrations/
#    - no unintended DROP COLUMN / DROP TABLE
#    - no data loss on production tables
#    - constraint names stable
# 4. Apply
pnpm --filter backend db:migrate
```

Commit the schema change and its generated SQL **together**. A schema edit without its migration, or a migration without its schema edit, leaves the repo in a state nobody can reproduce.

`db:push` exists but skips the migration file entirely — it is for throwaway local experimentation, never for a change that ships.

Step 3 is not optional. Read the generated SQL before applying it; `drizzle-kit` will happily emit a `DROP COLUMN` for what you intended as a rename.

## Required reading before a schema change

- `drizzle-master/SKILL.md`
- `drizzle-master/references/schema-overview.md`
- `drizzle-master/references/workflows.md`
- Any ADR in `apps/backend/docs/adr/` governing the table you are touching

## The flow into shared types

Drizzle table definitions are mirrored in `packages/schemas-types/src/tables/` as `App*` entity types (`AppUsers`, `AppRoles`, `AppActivityLogs`, …), re-exported through `tables/entity-types.ts` and consumed by the frontend and admin.

A schema change is therefore a **cross-app change**:

```
src/db/schema/**            →  db:generate  →  drizzle/migrations/*.sql
        ↓
packages/schemas-types/src/tables/**   →  pnpm --filter @repo/schemas-types build
        ↓
apps/backend · apps/frontend · apps/admin   →  build / check-types
```

Adding a column that a client will read means updating the entity type and rebuilding the package, or the frontend cannot see the field.

## Access patterns

- Queries and write primitives that more than one feature uses live in `src/domain/<domain>/<sub>/models/` — see `backend-queries`.
- Controllers never query. Services mutate but do not re-fetch what `resolveResources` already loaded.
- Multi-table writes that must be atomic go in a `db.transaction`; queue publishes happen **after** commit.

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Editing generated SQL to "fix" a migration | Fix the schema, regenerate |
| Editing `drizzle/migrations/meta/` | Never — it is drizzle-kit's bookkeeping |
| Deleting or amending an applied migration | Add a corrective migration |
| `db:push` for a change that ships | `db:generate` + review + `db:migrate` |
| Applying a migration without reading the SQL | Review the diff first |
| New table missing from `schema/index.ts` | Export it |
| Business-invariant index with no ADR | Write the ADR |
| In-place column rename on a production table | Add, backfill, drop across releases |
| Schema change without rebuilding `@repo/schemas-types` | Clients never see the field |

## Checklist

- [ ] Schema edited under `src/db/schema/**`, `app_` prefix, UUID PK, timestamps
- [ ] `index.ts` exports updated
- [ ] Relations declared in `relations.ts` where applicable
- [ ] `pnpm --filter backend db:generate` run
- [ ] Generated SQL **read**: no unintended DROP, no data loss, stable constraint names
- [ ] Destructive operations surfaced to the user, not applied silently
- [ ] ADR added for any business-invariant index
- [ ] Entity types updated and `pnpm --filter @repo/schemas-types build` passes
- [ ] Schema + migration committed together
- [ ] `pnpm --filter backend build` passes
