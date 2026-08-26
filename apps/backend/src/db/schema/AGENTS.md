# AGENTS.md (apps/backend/src/db/schema scope)

Codex/agents: this folder holds the **source of truth** for the DB schema. Migrations are generated from here.

Before editing, read:

- [../../../../../.github/instructions/backend-migrations.instructions.md](../../../../../.github/instructions/backend-migrations.instructions.md)
- [../../../../../drizzle-master/SKILL.md](../../../../../drizzle-master/SKILL.md)
- Any ADR in `../../../docs/adr/` that governs the table you are changing (see `.github/instructions/backend-adrs.instructions.md`).

Conventions:

- Table names use the `app_` prefix.
- UUID primary keys + `createdAt`/`updatedAt` timestamps.
- Keep `index.ts` exports synced when adding/renaming tables.
- After editing, run `pnpm run db:generate` from `apps/backend` and review the generated SQL.
