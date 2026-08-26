---
name: monorepo-architecture
description: Entry point for any work that spans more than one app or touches packages/. Use to decide which surface owns a change, which skill set applies, how turbo and pnpm filters work here, and what the real workspace inventory is. Routes to the per-app architecture skills.
---

# Monorepo Architecture — Orientation

`starter-monorepo` — pnpm 9 workspaces + Turborepo, Node >= 18.

```
apps/
├── backend        Express 5 + TypeScript + Drizzle + Postgres + Redis + RabbitMQ
├── frontend       Next.js 15 + React 19 (port 3000)
├── admin          Next.js 15 + React 19 (port 4000)
├── e2e-backend    Playwright API tests      ← excluded from the workspace
└── e2e-frontend   Playwright UI tests       ← excluded from the workspace
packages/
├── schemas-types      @repo/schemas-types   Zod payload schemas, response types, App* entity types  [build]
├── constants          @repo/constants       runtime enums, PERMISSIONS                             [build]
├── utilities          @repo/utilities       fetch helpers, error helpers, formatters               [build]
├── ui                 @repo/ui              shared React components                                [source-only]
├── styles             @repo/styles                                                                 [source-only]
├── eslint-config      @repo/eslint-config                                                          [config]
└── typescript-config  @repo/typescript-config                                                      [config]
```

`pnpm-workspace.yaml` includes `apps/*` and `packages/*` but **excludes** `apps/e2e-frontend` and `apps/e2e-backend` — they are not workspace members and do not participate in `pnpm -r` or turbo tasks.

## Routing a change

| The change is in | Load |
|---|---|
| `apps/backend/**` | `backend-architecture` |
| `apps/frontend/**` | `frontend-architecture` |
| `apps/admin/**` | `admin-architecture` |
| `packages/**` | `monorepo-packages`, plus `frontend-contracts` for `schemas-types` |
| More than one app | This skill first, then each app's |

A change that touches `packages/` is **never single-app**. Three consumers exist; assume all three until you have checked.

## Commands

```bash
pnpm install
pnpm build                 turbo run build     — respects ^build dependency order
pnpm lint                  turbo run lint
pnpm check-types           turbo run check-types
pnpm format                prettier --write
pnpm build:packages        constants + utilities + schemas-types only

pnpm --filter frontend dev
pnpm --filter admin lint
pnpm --filter backend build
pnpm --filter @repo/schemas-types build
```

`turbo.json` declares `build`, `lint`, `check-types` (each `dependsOn: ["^build"]` or its own upstream) and a non-cached persistent `dev`. Build outputs cached: `.next/**` (minus cache) and `dist/**`.

## Script inconsistencies that actually bite

| Surface | `check-types` | Type gate |
|---|---|---|
| `frontend` | ✅ `tsc --noEmit` | `check-types` |
| `admin` | ✅ `tsc --noEmit` | `check-types` |
| `backend` | ❌ **does not exist** | `pnpm --filter backend build` (`tsc && tsc-alias`) |
| `@repo/schemas-types` | ✅ | `build` |
| `@repo/utilities` | ⚠️ named **`type-check`**, not `check-types` | `build` |
| `@repo/constants`, `ui`, `styles`, configs | ❌ / partial | `build` where it exists |

`pnpm check-types` at the root therefore does **not** type-check the backend, and skips `@repo/utilities`. Run `pnpm --filter backend build` explicitly. Also note `pnpm --filter backend lint` runs `eslint --fix` — it rewrites files.

## The dependency spine

```
@repo/typescript-config, @repo/eslint-config     tooling
        ↓
@repo/constants  ·  @repo/utilities              runtime primitives
        ↓
@repo/schemas-types                              THE contract: schemas, response types, entity types
        ↓
apps/backend   ·   apps/frontend   ·   apps/admin
        ↑
@repo/ui  ·  @repo/styles                        frontend + admin only
```

`@repo/schemas-types` is the single contract between backend and both clients. Changing it changes all three apps at once — see `monorepo-contracts`.

## Ownership boundaries

- Business rules and persistence: **backend only**. A client never re-implements a validation rule the backend enforces.
- Validation messages: authored once in `@repo/schemas-types`, rendered identically by all three.
- Display labels for filters/statuses: authored in `@repo/schemas-types` constants and returned by the backend's list endpoints, so no client keeps its own copy.
- Shared UI: `@repo/ui`. Two apps needing the same component means it moves there — not a copy.
- App-specific logic stays in its app. Do not push admin-only or frontend-only concepts into `packages/`.

## Stale artifacts in the tree

Verified against the code — do not be misled by them:

- **`@repo/validations` and `@repo/types` do not exist.** `packages/AGENTS.md`, `api-workflow.instructions.md`, `get-list-service.instructions.md`, and `review-impact-frontend` all reference them. The real homes are `@repo/schemas-types` and `@repo/constants`.
- Root `CLAUDE.md` lists `apps/e2e-backend` as a workspace; `pnpm-workspace.yaml` excludes it.

## Automation

- **pre-commit** (`.husky/pre-commit`) — `lint-staged` for backend when backend files are staged; spec-drift, spec-stale, and stale-artifact warnings. **Warns, never blocks** (except backend lint-staged).
- **post-commit / post-checkout** — rebuild the `graphify` knowledge graph. Skipped during rebase/merge/cherry-pick; `GRAPHIFY_SKIP_HOOK=1` disables.
- **CI** — `.github/workflows/backend-ci.yml`, `deploy-dev.yml`, `ansible-lint.yml`. Backend lint-and-build is the blocking merge gate.

## Architecture discovery

When `graphify-out/` exists, read `graphify-out/GRAPH_REPORT.md` (and `wiki/index.md` if present) before grepping raw files — a `PreToolUse` hook in `.claude/settings.json` enforces this. Run `graphify update .` after modifying code in a session.

## Docs layout

- `.github/instructions/*.instructions.md` — repo-wide and backend standards
- `apps/frontend/instructions/`, `apps/admin/instructions/` — app-specific standards
- `apps/backend/docs/adr/` — architecture decision records
- `<feature-dir>/docs/frds/` — the FRD → TDD → issues spec chain
- `apps/backend/src/modules/<domain>/features/<feature>/docs/technical/` — runtime docs
