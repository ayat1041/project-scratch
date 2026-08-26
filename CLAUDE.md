# Monorepo Project Instructions

This is a monorepo containing:

- `apps/backend` — Node.js/Express 5 TypeScript REST API
- `apps/frontend` — Next.js 15 frontend app
- `apps/admin` — Next.js 15 admin panel
- `packages/*` — Shared types, validations, constants, UI components

## Commands & Skills

Every surface has a complete, layer-ordered set of skills and slash commands.
Start at the master map, which routes to the per-surface index:

@./.github/instructions/commands-and-skills-map.instructions.md

| Surface | Load first | Detailed index |
| --- | --- | --- |
| monorepo / `packages/` | `monorepo-architecture` | `.github/instructions/commands-and-skills-map.instructions.md` |
| `apps/backend` | `backend-architecture` | `.github/instructions/backend-commands-and-skills.instructions.md` |
| `apps/frontend` | `frontend-architecture` | `apps/frontend/instructions/frontend-commands-and-skills.instructions.md` |
| `apps/admin` | `admin-architecture` | `apps/admin/instructions/admin-commands-and-skills.instructions.md` |

## App-Specific Instructions

Nested `CLAUDE.md` files load automatically when working inside each app:

- `apps/backend/CLAUDE.md` — backend stack rules, middleware order, naming, migrations
- `apps/admin/CLAUDE.md` — admin Next.js rules and testing
- `apps/frontend/CLAUDE.md` — frontend Next.js rules and testing

## Package Manager

All commands use `pnpm`. Run workspace-scoped commands with:

```
pnpm --filter <app-name> <command>
```

## Available Agents

Specialized sub-agents live in `.claude/agents/`. Invoke them by name or let Claude route based on the task:

| Agent                      | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `backend-implementer`      | Implements backend endpoints end-to-end                   |
| `backend-reviewer`         | Reviews backend code for standards violations (read-only) |
| `backend-test-author`      | Authors integration and E2E tests                         |
| `backend-doc-writer`       | Generates feature-level runtime documentation             |
| `backend-migration-author` | Authors Drizzle schema changes and migrations             |
| `admin-reviewer`           | Reviews admin panel code (read-only)                      |
| `frontend-reviewer`        | Reviews frontend code (read-only)                         |

## Available Slash Commands

Commands live in `.claude/commands/`. Invoke with `/command-name`:

| Command                       | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `/scaffold-module`            | Scaffold a new backend feature folder                |
| `/create-endpoint`            | Create a new backend endpoint end-to-end             |
| `/db-change`                  | Schema change + Drizzle migration                    |
| `/generate-lovable-frd`       | Spec pipeline step 1: UI-sourced FRD from Lovable routes + workflow docs |
| `/generate-frd`               | Spec pipeline step 2: engineering FRD from the lovable FRD             |
| `/generate-tdd`               | Spec pipeline step 3: Technical Design Doc from the FRD                |
| `/generate-issues`            | Spec pipeline step 4: GitHub-ready issue doc from FRD + TDD            |
| `/generate-tests`             | Generate tests (TDD-gated — requires issue + TDD)    |
| `/generate-integration-tests` | Generate integration tests (no TDD gate)             |
| `/add-swagger-doc`            | Author or update a Swagger doc file                  |
| `/generate-technical-doc`     | Generate feature-level runtime docs                  |
| `/review-impact`              | Analyse impact of a changed backend file             |
| `/review-impact-admin`        | Analyse impact of a changed admin file               |
| `/review-impact-frontend`     | Analyse impact of a changed frontend file            |
| `/run-tests`                  | Detect runner and run a test file                    |
| `/spec-sync`                  | Reconcile specs (FRD/TDD) with implementation        |
| `/commit`                     | Generate commit message from staged changes & commit |

**→ For a complete guide on when to run each command, read [`.github/instructions/command-and-agent-workflow.instructions.md`](.github/instructions/command-and-agent-workflow.instructions.md)**

## Commits

Never commit without asking first. Always:

1. Show the diff to the user
2. Ask for approval
3. Commit only after user confirms

This ensures visibility and control over what lands on shared branches.
