# AGENTS.md (apps/backend/drizzle scope)

Codex/agents: before editing anything under this folder, read
[../../.github/instructions/backend-migrations.instructions.md](../../../.github/instructions/backend-migrations.instructions.md).

Hard rules (summary, see the instruction file for full text):

- Never hand-edit generated SQL under `drizzle/migrations/*.sql` or anything in `meta/`.
- Edit the schema in `apps/backend/src/db/schema/**` and regenerate via `pnpm run db:generate`.
- Review the SQL diff for unintended `DROP`/rename/constraint churn before committing.
- Surface destructive operations to the user; never apply silently.
