---
description: Make a backend schema change and produce the corresponding Drizzle migration.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# DB Change

## Step 1 — Gather inputs

Confirm (ask if missing):

- Tables affected
- Nature of change (add column, add table, add index, rename, drop, etc.)
- Invariant being enforced (if any) — may require partial/unique index and an ADR

## Step 2 — Required reading

- `.github/instructions/backend-migrations.instructions.md`
- `.claude/skills/backend-database/SKILL.md` — covers the schema → shared-type flow this command enforces
- `.github/instructions/type-centralization.instructions.md` — the single-source-of-truth rule for step 5
- `drizzle-master/SKILL.md`
- `drizzle-master/references/schema-overview.md`
- `drizzle-master/references/workflows.md`
- Any ADR in `.github/instructions/backend-adrs.instructions.md` that covers the table

## Step 3 — Edit the schema

- Only edit `apps/backend/src/db/schema/**`.
- Table names with `app_` prefix; UUID PKs; `createdAt`/`updatedAt`.
- Keep `apps/backend/src/db/schema/index.ts` exports in sync.

## Step 4 — Generate migration

From `apps/backend`:

1. `pnpm run db:generate`
2. Open the new file in `drizzle/migrations/*.sql`.
3. Review diff for unintended drops, constraint name churn, data-loss risk.
4. `pnpm run build`.

## Step 5 — Mirror the change into `packages/schemas-types/src/tables/**`

**A schema change is not done until its shared-type mirror is done.** Every table under `apps/backend/src/db/schema/**` has a hand-written Zod counterpart at the same relative path under `packages/schemas-types/src/tables/**` (e.g. `user-management/app_users.ts` ↔ `user-management/app_users.ts`) — this is the **only** place entity types, API request payload schemas, and API response schemas may be defined. Backend, frontend, and admin all import the *same* type from here; never redeclare an equivalent shape locally in an app.

1. For a new table: create the matching Zod schema file (same filename, same folder) — mirror each Drizzle column to its Zod field (`.notNull()` → required, otherwise `.nullable().optional()`), export `export const app<X>Schema` and `export type App<X> = z.infer<typeof app<X>Schema>`. Add the type export to `tables/entity-types.ts`.
2. For a changed table (added/removed/retyped column): apply the same diff to the existing Zod schema file. Update every `payload-schemas/**` file that composes fields from it.
3. **No barrel files.** Every schema/type is imported by its own direct path (e.g. `@repo/schemas-types/tables/user-management/app_users`, or `@repo/schemas-types/tables/entity-types` for the type-only aggregator) — never add an `index.ts` that re-exports the package's schemas under one path.
4. `pnpm --filter @repo/schemas-types build` must pass before touching any consuming app.
5. `pnpm --filter backend build && pnpm --filter admin run check-types && pnpm --filter frontend run check-types` must all pass — a backend service should declare its return type as the centralized response type from `packages/schemas-types`, not a local `type`/`interface`.

## Step 6 — Destructive change?

If the migration includes `DROP COLUMN`, `DROP TABLE`, in-place rename, or any data-loss operation:

- **Stop and surface to user.**
- Propose add-new -> backfill -> drop across releases instead.

## Step 7 — Report

- Schema files changed (backend + `packages/schemas-types` mirror).
- Generated SQL file path.
- 2–4 bullet summary of the SQL diff.
- Confirmation that `@repo/schemas-types`, backend, admin, and frontend all build/typecheck clean.
- Any data-backfill or redeploy step the user must run.
