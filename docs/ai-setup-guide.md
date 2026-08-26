# AI Setup Guide

How the Claude Code configuration in this monorepo is wired, and how to use it efficiently in a chat session.

> Scope: this guide focuses on the **backend** (`apps/backend`) since that is where the setup is most complete. The same patterns apply to `apps/frontend` and `apps/admin` where their reviewer agents and `AGENTS.md`/`CLAUDE.md` exist.

---

## 1. Mental Model

The setup has four layers Claude consults, roughly in this order:

```
1. Repo entry point        →  CLAUDE.md (root) + AGENTS.md (root)
2. Imported rules           →  .github/instructions/**/*.instructions.md
                               (pulled in via @-imports in CLAUDE.md files —
                               root CLAUDE.md, and per-app apps/*/CLAUDE.md)
3. On-demand knowledge      →  Skills (.claude/skills/*/SKILL.md, apps/backend/SKILL.md,
                               drizzle-master/SKILL.md)
4. Workflows                →  Agents     (.claude/agents/*.md)
                               Commands   (.claude/commands/*.md, invoked with /command-name)
                               Hooks      (apps/backend/.husky/*)
                               CI         (.github/workflows/backend-ci.yml)
```

Treat **instructions** as always-on rules for the paths that import them, **skills** as references Claude should load once when it enters a domain, **agents** as roles with a fixed tool allowlist, and **commands** as reusable slash-invoked workflows.

---

## 2. Files Inventory

### 2.1 Entry points

| File                                 | Purpose                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `CLAUDE.md` (repo root)              | Points to the commands/skills map, lists agents and commands                              |
| `AGENTS.md` (repo root)              | Global commands, workspace map, package-manager + node version                            |
| `apps/backend/CLAUDE.md`             | `@`-imports the backend-specific instruction files                                        |
| `apps/frontend/CLAUDE.md`            | Frontend equivalent                                                                       |
| `apps/admin/CLAUDE.md`               | Admin equivalent                                                                           |
| `apps/backend/AGENTS.md`, `apps/frontend/AGENTS.md`, `apps/admin/AGENTS.md` | Local commands per app |

### 2.2 Instructions (imported by `CLAUDE.md`)

Located under `.github/instructions/`. Each `CLAUDE.md` `@`-imports the files relevant to its app.

| File                                              | Topic                               |
| -------------------------------------------------- | ------------------------------------ |
| `commands-and-skills-map.instructions.md`         | Master routing map — start here      |
| `command-and-agent-workflow.instructions.md`      | When to run which command/agent      |
| `backend-agents.instructions.md`                  | Non-negotiable backend rules + stack |
| `api-workflow.instructions.md`                    | Lifecycle + middleware chain         |
| `api-documentation-guide.instructions.md`         | Swagger authoring                    |
| `backend-file-structure.instructions.md`          | Feature folder layout                |
| `backend-naming-conventions.instructions.md`      | File/var/const naming                |
| `error-handling.instructions.md`                  | asyncHandler + createError           |
| `get-list-service.instructions.md`                | GET list pattern                     |
| `backend-migrations.instructions.md`              | Drizzle schema/migration rules       |
| `backend-scripts.instructions.md`                 | One-off scripts policy               |
| `backend-adrs.instructions.md`                    | ADR pointer map                      |
| `testing.instructions.md`, `testing-backend.instructions.md` | Test layering + shared rules |
| `frontend-agents.instructions.md`, `testing-frontend.instructions.md` | Frontend equivalents |
| `admin-agents.instructions.md`, `testing-admin.instructions.md` | Admin equivalents |
| `type-centralization.instructions.md`             | Where shared types live              |
| `backend-commands-and-skills.instructions.md`     | Backend command/skill index          |

### 2.3 Skills (on-demand reference cards)

Located under `.claude/skills/` — one folder per topic, entry point is `SKILL.md`. Load the `*-architecture` skill for the surface you're working in first; it routes to the per-layer skill.

| Skill                       | Topic                                          |
| ---------------------------- | ----------------------------------------------- |
| `backend-architecture`      | Entry point for `apps/backend` — B1–B9 layers   |
| `frontend-architecture`     | Entry point for `apps/frontend` — L1–L8 layers  |
| `admin-architecture`        | Entry point for `apps/admin` — A1–A8 layers     |
| `monorepo-architecture`     | Entry point for cross-app/`packages/` work      |
| `backend-database`          | Drizzle schema + migrations                     |
| `backend-auth-and-policies` | Permissions, resource resolution, authorization |
| `apps/backend/SKILL.md`     | Backend stack quick reference (Express 5/Zod 4) |
| `drizzle-master/SKILL.md`   | Drizzle ORM workflows                           |

Run `/help` or open `.claude/skills/` to see the full list — there's one per architectural layer, plus cross-cutting ones (naming, error handling, testing).

### 2.4 Agents (`.claude/agents/*.md`)

Each agent has its own tool allowlist and required-reading list. Invoke by name or let Claude route based on the task.

| Agent                          | Role                                                       | Edits files? |
| ------------------------------- | ------------------------------------------------------------ | ------------ |
| `backend-reviewer`              | Strict code reviewer for backend PRs                        | No           |
| `backend-implementer`           | Implements features end-to-end in backend                   | Yes          |
| `backend-test-author`           | Writes integration-style service tests                      | Yes          |
| `backend-doc-writer`            | Writes feature-level `docs/technical/*-runtime.md`           | Docs only    |
| `backend-migration-author`      | Schema changes + `db:generate`; never hand-edits SQL          | Yes          |
| `frontend-reviewer`             | Frontend code reviewer                                       | No           |
| `admin-reviewer`                | Admin code reviewer                                          | No           |

### 2.5 Commands (`.claude/commands/*.md`)

Reusable workflows. Invoke with `/command-name`.

| Command                        | What it does                                                             |
| -------------------------------- | --------------------------------------------------------------------------- |
| `/create-endpoint`               | New endpoint: routes + middleware + controller + service + swagger + tests |
| `/scaffold-module`               | New feature folder per backend-file-structure                              |
| `/generate-integration-tests`    | Service-level integration tests (no TDD gate)                              |
| `/generate-tests`                | TDD-gated tests (requires issue + TDD sections)                            |
| `/generate-technical-doc`        | Feature runtime docs                                                       |
| `/add-swagger-doc`               | Author/update a `swagger-docs/*.swagger.ts` file                           |
| `/db-change`                     | Schema change + migration generation                                       |
| `/review-impact`                 | Impact report for a changed backend file (tests + swagger staleness)       |
| `/review-impact-frontend`        | Frontend impact report                                                     |
| `/review-impact-admin`           | Admin impact report                                                        |
| `/run-tests`                     | Detect runner and run a test file                                          |
| `/commit`                        | Generate commit message from staged changes & commit                       |

Frontend/admin also have their own `/frontend-*` and `/admin-*` commands (component, service, handler, hook, page, feature, scaffold-module, verify, audit, plan-feature) — see `.claude/commands/`.

### 2.6 Hooks (`apps/backend/.husky/` and root `.husky/`)

| Hook                        | What it enforces                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/backend/.husky/pre-commit` | `lint-staged` → grep guard against `handleError(` and manual error responses → `tsc --noEmit` for staged backend TS |
| `apps/backend/.husky/commit-msg` | `commitlint` against `apps/backend/commitlint.config.js` (conventional commits)                      |
| root `.husky/pre-commit`     | lint-staged (backend-scoped) + spec-drift/spec-stale warnings (never blocks) + stale test/swagger warnings |

### 2.7 CI (`.github/workflows/`)

| Workflow              | Trigger                                                | Steps                                   |
| --------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `backend-ci.yml`      | PRs touching `apps/backend/**` or `packages/**`        | `pnpm install` → `lint` → `build`        |
| `deploy.yml`          | Push to `dev`/`staging`                                | Build, push, SSH-deploy per changed app  |
| `ansible-lint.yml`    | PRs touching `infra/ansible/**`                        | `ansible-lint`                           |

---

## 3. How To Use The Setup In A Chat Session

### 3.1 The default loop (most tasks)

1. **Open the file you want to change** before chatting, or point Claude at the surface (`apps/backend`, `apps/frontend`, `apps/admin`). The nearest `CLAUDE.md` loads automatically.
2. State the task in one sentence. Don't paste boilerplate — the rules are already loaded via `CLAUDE.md`'s imports.
3. If the task matches a command, invoke it: `/create-endpoint`, `/generate-integration-tests`, etc.
4. If the task is purely a review, ask the appropriate reviewer agent (e.g. `backend-reviewer`).

### 3.2 Picking the right command or agent

| Goal                                              | Use                                       |
| --------------------------------------------------- | -------------------------------------------- |
| "Add a new endpoint"                              | `/create-endpoint`                           |
| "Scaffold a new feature folder"                   | `/scaffold-module`                           |
| "Write integration tests for this service"        | `/generate-integration-tests`                |
| "Write technical runtime docs for this feature"   | `/generate-technical-doc`                    |
| "Add a swagger doc for this endpoint"             | `/add-swagger-doc`                           |
| "Change a DB column / add an index"               | `/db-change`                                 |
| "Review this PR diff"                             | `backend-reviewer` agent                     |
| "What will break if I change this file?"          | `/review-impact`                             |

### 3.3 What you should always provide

- **File or path scope** — pin the target file/surface so the right `CLAUDE.md`/skills load.
- **Concrete inputs** — method/path/body shape for endpoints; tables/columns for schema; service exports for tests.
- **One sentence of intent** — what success looks like.

### 3.4 What you don't need to repeat

- Stack versions, Express 5 gotchas, Zod 4 gotchas → in `backend-agents.instructions.md` + `apps/backend/SKILL.md`.
- Middleware order, error handling, naming, file structure → covered by the relevant skill.
- ADR map → covered by `backend-adrs.instructions.md`.

### 3.5 Verification expectations

Every code change should end with:

- `cd apps/backend && pnpm run build` (passes).
- For schema changes: also `pnpm run db:generate` and review the SQL diff.
- For new endpoints: visual check at `http://localhost:8000/api-docs`.

The implementer/test-author agents are configured to run `pnpm run build` themselves before reporting done.

---

## 4. Prompt Recipes (Copy-Paste Ready)

### 4.1 Add a new endpoint

```
/create-endpoint

Module: user-management/api-keys
Method/Path: POST /api/user-management/api-keys
Permission: user_management.api_keys.create
Body: { name: string; scopes: string[] }
Response: { id: string; name: string; createdAt: string }
Errors: VALIDATION (duplicate name), CONFLICT (scope limit)
```

### 4.2 Generate integration tests for a service

```
/generate-integration-tests

Target: apps/backend/src/modules/user-management/api-keys/services/api-key.service.ts
Cover: every exported action.
Mirror style: apps/backend/src/modules/user-management/permissions/tests/integration/
```

### 4.3 Generate a technical doc

```
/generate-technical-doc

Target: apps/backend/src/modules/user-management/F6002-roles
Include nested subfeatures.
```

### 4.4 Make a schema change

```
/db-change

Tables: app_api_keys (new)
Change: create table with id (uuid PK), name (text), scopes (text[]), createdAt, updatedAt
Invariant: (userId, name) unique
```

### 4.5 Code review

```
@backend-reviewer

Please review: apps/backend/src/modules/user-management/api-keys/services/api-key.service.ts
```

### 4.6 Impact analysis before merging

```
/review-impact

File: apps/backend/src/modules/user-management/roles/services/role.service.ts
```

---

## 5. Doing Things Efficiently

### 5.1 Pin scope, don't restate rules

Bad:

> Please follow the middleware order isAuthenticated -> hasPermission -> ... and use asyncHandler and never use handleError and ...

Good:

> Add a DELETE endpoint at `/api/user-management/roles/:id` with permission `user_management.roles.delete`.

The rules are already loaded — restating them wastes tokens and risks contradiction.

### 5.2 Use commands over freeform requests for repeatable work

Every command enforces the gate checks (required reading, verification step, output format). Freeform requests skip those gates and produce inconsistent results across sessions.

### 5.3 Let agents own verification

The implementer and test-author agents run `pnpm run build` before reporting done. If you ask in freeform, you may have to remind them.

### 5.4 Read the ADRs once per area

When you start working in a new code area, skim the ADR(s) listed in `.github/instructions/backend-adrs.instructions.md` for that area. Claude will reread them, but a human sanity-check catches conflicts faster.

### 5.5 Avoid mixing scopes in one turn

Splitting "write the endpoint, run the tests, fix the swagger, and update the docs" into separate commands gives each one the right context and lets you accept/reject independently. The commands are designed for this.

### 5.6 Keep the husky hooks honest

If `tsc --noEmit` in pre-commit fails, fix the type errors — do not bypass with `--no-verify`. The CI workflow runs the same checks and will block the PR.

---

## 6. Extending The Setup

When repeating a task type for the third time, promote it:

1. **New rule that should always apply** → add an instruction file under `.github/instructions/` and `@`-import it from the relevant `CLAUDE.md`.
2. **New domain knowledge worth caching** → add a skill under `.claude/skills/`.
3. **New repeatable workflow** → create a command in `.claude/commands/`.
4. **New specialised role** → create an agent in `.claude/agents/`.
5. **New non-negotiable check** → add to the husky pre-commit and/or CI workflow.

Keep instructions concise and link to skills/ADRs for depth.

---

## 7. Quick Troubleshooting

| Symptom                                                          | Likely cause                                          | Fix                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------ |
| Claude ignored a rule                                            | The relevant `CLAUDE.md` doesn't import that instruction file | Add the `@`-import, or quote the rule explicitly              |
| Claude generated Express 4 patterns                               | Stack section wasn't read                              | Reference `apps/backend/SKILL.md` or open a backend file first |
| `tsc --noEmit` keeps failing pre-commit                          | Type errors in staged backend TS                       | Fix them; do not use `--no-verify`                              |
| `commit-msg` hook says command not found                         | `@commitlint/cli` not installed                       | Run `pnpm install` at repo root                                 |
| CI passes locally but fails on PR                                | Outdated lockfile                                      | Regenerate via `pnpm install` and commit `pnpm-lock.yaml`       |
| Agent re-fetched data in a service                               | Didn't read `api-workflow.instructions.md`             | Mention the file path of a `*.service.ts` to force the rule     |

---

## 8. One-Liner Summary

> Open the target file, invoke the matching command, let the agent run `pnpm run build`, and rely on the husky + CI gates to catch the rest. Only restate rules when Claude breaks one — otherwise let `CLAUDE.md`'s imports do the work.
