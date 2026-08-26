# Jira Conventions

How this monorepo's modules, features, and endpoint slices map onto Jira, and the conventions
every issue, branch, and commit follows.

**Plan tier:** Jira Free (< 10 users) · **Projects:** one, for the whole product · **Project
type:** company-managed.

---

## 1. Why this document exists

The team already has a working spec pipeline and a working decomposition strategy. This document
gives them Jira field names and prevents the plan and the tracker from drifting apart.

The pipeline:

```
/generate-lovable-frd → /generate-frd → /generate-tdd → /generate-issues → Jira → code
```

`/generate-issues` produces the shape Jira needs: an Epic definition, ordered issue drafts sliced
per endpoint, an FR/AC traceability matrix, a dependency graph, and a PR breakdown.

---

## 2. The unit of work: one endpoint, one Story

**A Story is one endpoint, delivered end to end.** Validation → service → controller → route →
integration tests → API E2E → Swagger. It is not done until the endpoint is reachable,
authorized, and green on both test layers.

### Story vs Task

| Issue type | Delivers | Examples |
| --- | --- | --- |
| **Story** | One reachable, user-observable endpoint | List, Create, Update, Delete |
| **Task** | Enabling work with no endpoint | Foundation (schema + migration + contracts + resolver), lifecycle crons, runtime doc + runbook, release readiness, ADRs |

Keeping enabling work as **Task** rather than Story makes "how many endpoints shipped this
sprint" a countable number: `type = Story AND status = Done`.

### The sub-task set

Every endpoint Story gets the same sub-tasks — the Definition-of-Done gates, not the code layers
(the layers all land in one commit):

```
Story  <KEY>-52   Create resource (batch)
  Sub-task   implement — validation, service, controller, route
  Sub-task   integration tests — backend ACs (TDD §13.1)
  Sub-task   API E2E tests — cross-cutting ACs (TDD §13.3)
  Sub-task   swagger doc
```

Add a fifth, `unit tests`, only when the slice has branchy pure logic (validation aggregation,
state-transition guards).

### Definition of Done — Story

- Endpoint registered; middleware order is `isAuthenticated → hasPermission → resolveResources → authorize → controller`
- Every AC in the description checked off
- Integration tests green, file headers carrying their `F####-AC-X` markers
- API E2E green for the cross-cutting ACs
- Swagger doc written and matching the implemented route
- `pnpm --filter backend build` passes
- Reviewed via the relevant `*-reviewer` agent (see [CLAUDE.md](../CLAUDE.md))

### Testing posture

**Test-after, same Story.** Tests are written after the endpoint works but inside the same Story
and the same PR — a hard gate, never a follow-up issue.

Lock the response/error contract to TDD §7 before writing assertions, so tests aren't rewritten
when the contract settles.

---

## 3. Hierarchy mapping

Jira Free caps the hierarchy at **three levels** — Epic → Story/Task/Bug → Sub-task. There is no
Advanced Roadmaps and therefore no Initiative. The "module" layer is expressed as a **field**,
not as a parent issue.

| Codebase / pipeline concept | Jira | Example |
| --- | --- | --- |
| The product | **Project** | `<PROJECT_KEY>` |
| Module / domain (`auth`, `user-management`, `common`, `platform`, …) | **Component** | `user-management` |
| App / layer (`backend`, `frontend`, `admin`, `e2e`, `db`, `infra`) | **Label** | `be`, `fe` |
| Feature `F6001` + the ISSUES doc §3 Epic Definition | **Epic** | `F6001 · Permissions` |
| ISSUES doc §4 endpoint slice | **Story** | `Create permission` |
| ISSUES doc §4 non-endpoint issue | **Task** | `Foundation — schema, contracts, resolver` |
| DoD gate within a slice | **Sub-task** | `integration tests` |
| FR → AC traceability matrix | Table in the Story description | ISSUES doc §6 |
| Acceptance criterion (`F6001-AC-4`) | Checklist in the Story description — *not* its own issue | |
| ISSUES doc §5 dependency graph | Issue links (`blocks` / `is blocked by`) | Story 4 *is blocked by* Story 3 |
| Defect | **Bug**, labelled with the feature ID | `labels = F6001` |
| Release cut | **Fix Version** | `2026.09` |

**An FR is not a Story.** One endpoint slice can cover several FRs, and one FR can span several
slices — the relationship is many-to-many, so it lives in the description matrix, not the issue
tree.

### Use a company-managed project

Team-managed projects on the Free tier have thinner Component and workflow support. Components
are load-bearing here, so the project must be company-managed.

### Two conventions replace the missing Initiative level

**1. Component = module.** Set on the Epic and inherited onto every Story, Task, and Bug
beneath it. Gives per-module swimlanes, filters, and the Component report.

**2. Feature ID = Label**, on the Epic and every child issue. Makes the whole feature retrievable
in one query:

```jql
project = <PROJECT_KEY> AND labels = F6001 ORDER BY created
```

Free tier gives no reliable custom-field guarantee, so a label is the portable carrier of the ID.
Also prefix the Epic summary with the ID so it reads correctly everywhere without opening the
issue.

---

## 4. Why one-issue-per-endpoint

**Vertical beats horizontal, decisively.** A horizontal breakdown (all schema → all services →
all controllers) produces nothing shippable until the end and surfaces integration bugs last.
Each vertical slice merges as a working, tested, reachable endpoint.

**One endpoint is the right PR size.** Reviewable in one sitting, revertible in one commit, and
it matches how a developer actually holds a task in their head.

**Tests inside the slice, as a gate.** Test debt is created by the follow-up ticket. Making tests
a DoD gate on the same PR is the single highest-leverage rule here.

**Per-issue FR/AC traceability.** Coverage can be proven at merge time rather than argued about.

### Rules that keep this from drifting

**Rule 1 — Infrastructure inside a slice becomes its own issue.** If a slice introduces a queue,
worker, cron, or external integration, that infrastructure is a separate Task the endpoint Story
is blocked by. The endpoint stays one slice; the infra doesn't drag it.

**Rule 2 — Swagger ships inside the slice; only the runtime doc and runbook may trail.** Swagger
is a sub-task on every endpoint Story. The runtime doc, runbook, and bridge reconciliation stay a
trailing Task, since they need every endpoint to have settled.

**Rule 3 — Never back-annotate a closed issue.** If scope grows after close: new FR in the FRD,
new Story, link it `relates to` the original. The old Story stays closed and wrong-in-the-past —
that's fine, and it keeps sprint history honest.

**Rule 4 — Stamp the Jira key back into the ISSUES doc at creation time.** Every `### Issue N`
heading gets a `**Jira:** <KEY>-nn` line the moment the issue is created, in the same commit.

---

## 5. Module → band allocation

**The band is the module.** Every feature ID's leading digit identifies its module, and every
module maps to exactly one Jira Component. The starter ships four bands — add one per new module
as the project grows (see `apps/backend/src/modules/AGENTS.md` for the folder convention):

| Band | Module | Component | Source of truth |
| --- | --- | --- | --- |
| `F1xxx` | Authentication | `auth` | `apps/backend/src/modules/auth/` |
| `F5xxx` | Common / reference data | `common` | `apps/backend/src/modules/common/` |
| `F6xxx` | User management | `user-management` | `apps/backend/src/modules/user-management/` |
| `F9xxx` | Platform / infra | `platform` | `apps/backend/src/modules/platform/` |
| `F2xxx`–`F4xxx`, `F7xxx`–`F8xxx` | *reserved* | — | assign to your first new business modules |

Shared directories are deliberately excluded from numbering: `modules/shared/` and any
`features/shared/` folder hold cross-feature helpers, not features. Work on them is labelled with
the consuming feature's ID.

### The feature registry

The registry lives in **`packages/constants/src/modules/features/`** (not the backend), because
`apps/frontend` and `apps/admin` also reference feature IDs. It mirrors the shape of
[`permissions-to-routes/`](../packages/constants/src/modules/permissions-to-routes/) — nested
const object, barrel `index.ts`, exported types, derived flat lookups:

```ts
export interface FeatureDefinition {
  id: string;              // 'F6001'
  module: ModuleKey;       // 'user-management'
  slug: string;            // 'permissions' — must match the folder
  label: string;           // 'Permissions' — the Jira Epic summary
  jiraEpic: string | null; // '<KEY>-40'; null until the Epic exists
  apps: AppKey[];          // ['backend', 'admin'] — drives the Jira labels
  status: 'shipped' | 'in-progress' | 'planned' | 'retired';
}
```

**Drift guard.** A registry nobody validates decays. Add a `node:test` + `tsx` test in the
existing `**/tests/integration/*.test.ts` style that globs `apps/backend/src/modules/*/features/F*`
and asserts, in both directions: every `F####-<slug>` folder has a matching `FEATURES` entry,
every non-retired entry has a folder, no ID appears twice, and every ID falls inside its module's
band.

---

## 6. Workflow conventions

### Board

One Scrum board on `<PROJECT_KEY>`. Two-week sprints. Swimlanes grouped by Epic.

### Bootstrapping Epics

Generate a CSV from the registry and bulk-import Epics, so Jira and code agree from day one. Then
backfill each `jiraEpic` key into `features.ts` in a single commit.

| CSV column | Source |
| --- | --- |
| Summary | `` `${id} · ${label}` `` |
| Issue Type | `Epic` |
| Component | `MODULES[feature.module].jiraComponent` |
| Labels | `feature.id` + one per entry in `feature.apps` |

### Bootstrapping Stories from the ISSUES doc

`/generate-issues` output maps field-for-field — no new tooling needed:

| Jira field | Source in `F####-ISSUES-<slug>.md` |
| --- | --- |
| Epic Summary / Description / AC checklist | §3.1 Epic Title, §3.2 Description, §3.3 Epic ACs |
| Issue Type | `Story` if the §4 issue delivers an endpoint, else `Task` |
| Summary | §4 issue heading, with `Issue N:` stripped |
| Description | Summary + Vertical Scope + FR/AC traceability table + Implementation Steps |
| AC checklist | The issue's `#### Acceptance Criteria` block, verbatim |
| Epic Link | The feature's Epic key |
| Component | Module (from the band) |
| Labels | Feature ID + app labels + the issue's `**Suggested Labels:**`, minus any that duplicate the Component |
| Priority | `P0` → Highest, `P1` → High, `P2` → Medium |
| Assignee / team | `**Suggested Owner:**` |
| Issue links | `**Dependencies:**` and §5 dependency graph → `is blocked by` |
| Sub-tasks | The DoD gates in §2 |

Then apply Rule 4 (§4): write `**Jira:** <KEY>-nn` under each `### Issue N` heading, in the same
commit that creates the issues.

### Branch naming

```
feature/<KEY>-43-F6001-create-permission
```

Jira key first, so the free GitHub-for-Jira integration auto-links branches, commits, and PRs.
Feature ID second, keeping the branch greppable against the codebase.

### Commit convention

Conventional Commits, feature ID as the scope, Jira key in the subject so smart commits fire:

```
feat(F6001): add create-permission endpoint <KEY>-43
```

### PRs

One PR per Story. A backend endpoint PR must not merge until its integration **and** API E2E
tests are green. Keep the Foundation Task's PR isolated — schema and migrations carry different
review risk. Flag PRs that change operational behavior (worker, cron, queue) in the description
so they get a closer read.

### Definition of Done — Epic

- FRD, TDD, and ISSUES present under the feature's `docs/frds/`
- Every `### Issue N` heading carries its `**Jira:**` key
- Runtime doc present under `docs/technical/`
- Swagger complete for every endpoint
- Integration + E2E tests carrying `AC-x` / `TC-####` markers
- `/spec-sync` run with no DRIFT/GAP items remaining
- Registry entry set to `status: 'shipped'`
