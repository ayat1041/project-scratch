---
description: "Master map of every skill and slash command in this monorepo, grouped by surface (monorepo, backend, frontend, admin) and ordered by architecture layer. Start here to find which skill governs a layer and which command builds it."
applyTo: "**"
---

# Commands & Skills Map

Every surface has a complete, sequential set. Skills live in `.claude/skills/<name>/SKILL.md` and load automatically when their subject comes up; commands live in `.claude/commands/<name>.md` and are invoked as `/<name>`.

**39 skills · 51 commands · 4 surfaces.**

---

## Start here

| Working in | Load first | Detailed index |
|---|---|---|
| More than one app, or `packages/` | `monorepo-architecture` | this file |
| `apps/backend/**` | `backend-architecture` | `.github/instructions/backend-commands-and-skills.instructions.md` |
| `apps/frontend/**` | `frontend-architecture` | `apps/frontend/instructions/frontend-commands-and-skills.instructions.md` |
| `apps/admin/**` | `admin-architecture` | `apps/admin/instructions/admin-commands-and-skills.instructions.md` |

A change touching `packages/` is **never single-app** — three consumers exist.

---

## Monorepo (4 skills · 5 commands)

| Skill | Covers |
|---|---|
| `monorepo-architecture` | Workspace inventory, turbo/pnpm filters, dependency spine, script inconsistencies, stale artifacts |
| `monorepo-packages` | The three package types, creating/changing a package, export stability, consumer reconciliation |
| `monorepo-contracts` | `@repo/schemas-types` as the cross-app spine, full-stack implementation order, `ApiResponse<T>` |
| `monorepo-conventions` | Commits, husky hooks, CI gates, the FRD→TDD→issues chain, ADRs, feature IDs, docs placement, secrets |

| Command | Purpose |
|---|---|
| `/monorepo-plan-fullstack` | Plan a feature spanning backend + client(s); settle the contract first |
| `/monorepo-contract-change` | Change a shared contract and reconcile all three apps |
| `/monorepo-package` | Create or change a shared package |
| `/monorepo-audit` | Cross-app seams: contract duplication, drifted logic, stale references |
| `/monorepo-verify` | Repo-wide gate across packages, backend, frontend, admin |

---

## Backend (14 skills · 6 new commands + 10 existing)

Request → database:

| # | Layer | Skill | Command |
|---|---|---|---|
| B1 | Route | `backend-routes` | `/create-endpoint` |
| B2 | Auth chain + policies | `backend-auth-and-policies` | `/backend-policy` |
| B3 | Validation | `backend-validation` | *(in `/create-endpoint`)* |
| B4 | Controller | `backend-controllers` | `/create-endpoint` |
| B5 | Service | `backend-services` | `/create-endpoint` |
| B6 | Domain queries/commands | `backend-queries` | `/backend-query` |
| B7 | Database | `backend-database` | `/db-change` |
| B8 | API docs | `backend-swagger` | `/add-swagger-doc` |
| B9 | Queues + workers | `backend-workers` | `/backend-worker` |

Cross-cutting skills: `backend-architecture`, `backend-errors`, `backend-naming`, `backend-list-endpoints`, `backend-testing`.

New commands: `/backend-plan-feature`, `/backend-query`, `/backend-policy`, `/backend-worker`, `/backend-audit`, `/backend-verify`.
Existing: `/scaffold-module`, `/create-endpoint`, `/db-change`, `/add-swagger-doc`, `/generate-tests`, `/generate-integration-tests`, `/run-tests`, `/generate-technical-doc`, `/review-impact`, `/spec-sync`.

**The rule everything hangs off:** `isAuthenticated → hasPermission → resolveResources → authorize → Controller → Service`. Controllers never query; services never re-fetch.

---

## Shared Next.js patterns (2 skills)

`apps/frontend` and `apps/admin` are the same stack. Both follow **two** canonical module
patterns, documented once and used by both:

| Skill | Pattern | Frontend reference | Admin reference |
|---|---|---|---|
| `nextjs-list-page-pattern` | SSR list page — `Presenter.tsx` + co-located `use<Entity>Table.ts` + `router.refresh()` | `modules/user-management/api-keys/` (hypothetical), `.../user-preferences/` (hypothetical) | `modules/roles/`, `.../permissions/` |
| `nextjs-live-table-pattern` | React Query live table — `use<Feature>Query` + section context + polling | `modules/user-management/api-keys/` (hypothetical) | none yet |

**`roles`, `permissions`, and `languages` are the real, current admin modules — admin's
whole CRUD surface.** Frontend has no list/table-page module left; `api-keys` and
`user-preferences` above are illustrative hypothetical modules for the pattern, not code
that exists yet. Do not invent a third shape.

`frontend-contracts` (L0) and `frontend-naming` are shared by both apps rather than
duplicated — a duplicated contract doc is exactly the drift this repo already suffers from.

---

## Frontend (13 skills · 13 commands)

UI → API:

| # | Layer | Skill | Command |
|---|---|---|---|
| L0 | Shared contracts | `frontend-contracts` | `/frontend-contract` |
| L1 | Route entry | `frontend-route-entry` | `/frontend-page` |
| L2 | Components | `frontend-components` | `/frontend-component` |
| L3 | Section context | `frontend-section-context` | *(in `/frontend-component`)* |
| L4 | Hooks | `frontend-hooks` | `/frontend-hook` |
| L5 | Handlers | `frontend-handlers` | `/frontend-handler` |
| L6 | Services | `frontend-services` | `/frontend-service` |
| L7 | API transport | `frontend-api-layer` | `/frontend-api` |
| L8 | Next.js route handlers | `frontend-route-handlers` | *(hand-written)* |

Cross-cutting: `frontend-architecture`, `frontend-error-handling`, `frontend-naming`, `frontend-testids-and-testing`.
Commands also: `/frontend-plan-feature`, `/frontend-scaffold-module`, `/frontend-feature` (full slice), `/frontend-test`, `/frontend-audit`, `/frontend-verify`, `/review-impact-frontend`.

---

## Admin (11 skills · 11 commands)

UI → API:

| # | Layer | Skill | Command |
|---|---|---|---|
| A1 | Route entry | `admin-route-entry` | `/admin-page` |
| A2 | Components | `admin-components` | `/admin-component` |
| A3 | Section context | `admin-section-context` | `/admin-component` |
| A4 | Hooks | `admin-hooks` | `/admin-component` |
| A5 | Handlers | `admin-handlers` | `/admin-handler` |
| A6 | Services | `admin-services` | `/admin-service` |
| A7 | API transport | `admin-api-layer` | `/admin-api` |
| A8 | Route handlers | `admin-route-handlers` | *(hand-written)* |

Cross-cutting: `admin-architecture`, `admin-error-handling`, `admin-testids-and-testing`.
Commands also: `/admin-plan-feature`, `/admin-scaffold-module`, `/admin-test`, `/admin-audit`, `/admin-verify`, `/review-impact-admin`.

**Admin mirrors the frontend layer for layer** — same patterns, same rules, different paths.
`modules/roles/` and `modules/permissions/` both follow this shape. If you find one has
drifted (table-state hook not moved into `(table)/`, dialogs not consolidated into
`<Entity>Dialogs.tsx`, `tableState` not passed as one prop, `utils/testids.ts` missing),
converge it to match the other rather than inventing a third shape.

---

## Repo-wide commands (no surface prefix)

| Command | Purpose |
|---|---|
| `/generate-lovable-frd` → `/generate-frd` → `/generate-tdd` → `/generate-issues` | The spec chain; each gate-checks its inputs |
| `/spec-sync <feature>` | Reconcile FRD/TDD with the implementation before merge |
| `/commit` | Conventional commit message from staged changes |

---

## Full-stack workflow

```
/monorepo-plan-fullstack        surfaces, contract table, per-surface layers, seams
        ↓
PHASE 1  packages/              schemas, response types, entities, constants, permissions
         GATE: pnpm --filter @repo/schemas-types build
        ↓
PHASE 2  backend                /db-change → /backend-query → /backend-policy
                                → /create-endpoint → /backend-worker → /add-swagger-doc
                                → /generate-tests
         GATE: /backend-verify
        ↓
PHASE 3  clients (parallel)     frontend: /frontend-api → service → handler → hook → component → page
                                admin:    /admin-api    → service → handler → component → page
         GATE: /frontend-verify · /admin-verify
        ↓
PHASE 4  /monorepo-audit → /monorepo-verify → /spec-sync → /commit
```

**Contracts first, backend second, clients last.** A client written against an uncommitted shape produces two divergent truths.

---

## Agents

| Agent | Use for |
|---|---|
| `backend-implementer` | Implementing complex endpoints |
| `backend-reviewer` | Backend standards review (read-only) |
| `backend-test-author` | Integration and E2E test suites |
| `backend-doc-writer` | Feature runtime documentation |
| `backend-migration-author` | Schema changes and migrations |
| `frontend-reviewer` | React/Next boundaries, a11y, performance (read-only) |
| `admin-reviewer` | Admin panel review (read-only) |

---

## Verification, by surface

```bash
# packages (dependency order)
pnpm build:packages                       # constants + utilities + schemas-types

# backend — NOTE: no check-types script exists
pnpm --filter backend build               # tsc && tsc-alias — the type gate
pnpm --filter backend lint                # eslint --fix — REWRITES FILES
pnpm --filter backend test                # node:test — needs local Postgres/Redis/Qdrant
pnpm --filter backend test:integration    # Jest — integration/ folders only

# frontend / admin
pnpm --filter frontend check-types && pnpm --filter frontend build && pnpm --filter frontend test
pnpm --filter admin check-types    && pnpm --filter admin build    && pnpm --filter admin test
```

Root `pnpm check-types` does **not** cover the backend (no such script) and skips `@repo/utilities` (its script is named `type-check`). A green root run is not full coverage.

---

## Stale references across the instruction docs

These appear in existing instruction files and are **wrong**. Verified against the code:

| Claim | Reality |
|---|---|
| `@repo/validations`, `@repo/types` | Neither package exists; neither is imported anywhere. Use `@repo/schemas-types` / `@repo/constants` |
| `pnpm --filter backend check-types` | No such script. `build` is the type gate |
| `createErrorWithStatus` (frontend + admin docs) | The export is `createApiError`. A local copy survives only in the legacy `apps/frontend/features/*/_api/` files |
| `AuthApiError` / `parseSignInError` (frontend error doc) | Neither exists anywhere in the repo. `sign-in.handlers.ts` toasts like any other handler |
| Layer folders are `_`-prefixed | All of `modules/` uses `api/`, `services/`, `handlers/`. Only the legacy `apps/frontend/features/` tree is prefixed |
| `types/domain.ts` / `validations/schemas.ts` re-export package types | They hold **local** code only; re-exporting is an anti-pattern |
| `api-constants.ts` prefixes `NEXT_PUBLIC_API_URL` | Builders return path-only strings; the fetch helper prefixes |
| `apps/e2e-backend` is a workspace (root `CLAUDE.md`) | `pnpm-workspace.yaml` excludes both e2e apps |

Two legacy zones exist and should not be copied: `apps/frontend/features/` (~54 files: `_api/`, `_handlers/`, local `createErrorWithStatus`, `sonner` in a hook) and the three backend `features/*/_api/` files. Report findings there as legacy debt, not blocking regressions.

### Duplicate instruction files

`frontend-agents.instructions.md` and `admin-agents.instructions.md` each exist **twice**, with different content:

| File | Lines | Status |
|---|---|---|
| `.github/instructions/frontend-agents.instructions.md` | 38 | Thin stub. Names `@repo/types` and `@repo/validations`, neither of which exists |
| `apps/frontend/instructions/frontend-agents.instructions.md` | 456 | **Authoritative** |
| `.github/instructions/admin-agents.instructions.md` | 38 | Thin stub |
| `apps/admin/instructions/admin-agents.instructions.md` | 415 | **Authoritative** |

Both stubs carry `applyTo: "apps/<app>/**"` frontmatter, so an editor that auto-applies instruction files may still inject them. Prefer the app-local file in every case; if the two disagree, the app-local one wins. Consolidating them is worth doing but has not been done here.
