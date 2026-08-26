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

## Step 5 — Destructive change?

If the migration includes `DROP COLUMN`, `DROP TABLE`, in-place rename, or any data-loss operation:

- **Stop and surface to user.**
- Propose add-new -> backfill -> drop across releases instead.

## Step 6 — Report

- Schema files changed.
- Generated SQL file path.
- 2–4 bullet summary of the SQL diff.
- Any data-backfill or redeploy step the user must run.
