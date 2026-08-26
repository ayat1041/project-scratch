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
- **Every table here has a hand-written Zod mirror at the same relative path under `packages/schemas-types/src/tables/**`.** A schema change is not done until that mirror is updated and `entity-types.ts` is updated for new tables — see `.claude/skills/backend-database/SKILL.md` and the `/db-change` command. Entity types, request payload schemas, and response schemas live *only* in `packages/schemas-types`, imported directly (no barrel) — never redeclare an equivalent shape in the backend or a client app.
