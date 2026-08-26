---
name: monorepo-conventions
description: Repo-wide conventions outside any single app — commits, husky hooks, CI gates, the FRD/TDD/issues spec chain, ADRs, feature IDs, docs placement, and secret handling. Use when committing, opening a PR, writing a spec or ADR, or wondering what runs automatically.
---

# Repo Conventions

## What runs automatically

| When | What | Blocks? |
|---|---|---|
| Session start | `check-graph-freshness.sh` — warns if the graphify knowledge graph is stale | No |
| Before a Read/Glob/grep of source | A `PreToolUse` hook requires `graphify query` first when `graphify-out/graph.json` exists | Advisory |
| `git commit` | `lint-staged` for backend, when backend files are staged | **Yes** |
| `git commit` | Spec-drift (endpoint↔swagger, enum↔doc), spec-stale (FRD behind code), stale test/swagger artifacts | No — warn only |
| After commit / branch switch | graphify graph rebuild. Skipped during rebase/merge/cherry-pick; `GRAPHIFY_SKIP_HOOK=1` disables | No |
| PR / push | `.github/workflows/backend-ci.yml` — backend lint + build | **Yes** |

Pre-commit warnings are not noise. "endpoint missing swagger" → `/add-swagger-doc`. "AC-5 has no test" → add it. "FRD 7 commits behind" → `/spec-sync`.

## Commits

Conventional commits, enforced by `commitlint` per app:

```
feat(backend): #18 implement API key management for users
fix(frontend): #42 reset dialog loading state on failed save
chore(packages): rebuild schemas-types after status enum change
```

Scope is the surface — `backend`, `frontend`, `admin`, `packages`. Link the issue number when one exists. `/commit` generates the message from staged changes.

Commit related changes **together**: a schema edit with its generated migration; a contract change with every consumer it touched. A commit that builds only in combination with the next one is not a commit.

## The spec chain

```
/generate-lovable-frd  <FeatureID>   UI-as-built facts from a Lovable prototype + workflow docs
        ↓
/generate-frd          <FeatureID>   business rules, scope, FR/BR/AC split by layer
        ↓
/generate-tdd          <FeatureID>   DB design, endpoint design, testing strategy, ADR candidates
        ↓
/generate-issues       <FeatureID>   epic, ordered issue drafts, blockers, PR breakdown
```

Written to `<feature-dir>/docs/frds/` as `<FeatureID>-FRD(lovable)-<slug>.md`, `<FeatureID>-FRD-<slug>.md`, `<FeatureID>-TDD-<slug>.md`, `<FeatureID>-ISSUES-<slug>.md`. Each command gate-checks its inputs and stops if run out of order. `SC-*` / `OQ-*` ids carry forward by original id.

Skip the chain when an approved FRD/TDD/issue set already exists. `/spec-sync <feature>` reconciles specs against the implementation before merge.

## Feature IDs

Backend features are folders prefixed `F<NNNN>-`, allocated per domain: `F1xxx` auth, `F5xxx` common, `F6xxx` user-management, `F9xxx` platform. Check `src/modules/<domain>/` and take the next free number in that series. Never invent a new prefix. The same ID threads through the FRD, TDD, issues, and the folder name.

## ADRs

`apps/backend/docs/adr/`, indexed by `.github/instructions/backend-adrs.instructions.md`. Write one for a decision that is expensive to reverse: a partial/unique/composite index encoding a business invariant, a queue topology choice, an auth model change, a durable wire-name decision. Read the governing ADR before changing a table or a queue it covers.

## Docs placement

| Doc | Location |
|---|---|
| Repo-wide / backend standards | `.github/instructions/*.instructions.md` |
| Frontend / admin standards | `apps/<app>/instructions/*.instructions.md` |
| ADRs | `apps/backend/docs/adr/` |
| Spec chain | `<feature-dir>/docs/frds/` |
| Module requirement/design | `src/modules/<domain>/docs/` |
| Feature runtime docs | `src/modules/<domain>/features/<feature>/docs/technical/` |

Naming: kebab-case, descriptive noun phrases. `<feature>-frd.md`, `<feature>-tdd.md`, `<subject>-runtime.md`.

**`*-runtime.md` documents implemented behaviour only** — real states, real triggers, real tables, real errors and their HTTP mappings, real side effects. Planned design goes in `*-tdd.md`; business requirements in `*-frd.md`. A runtime doc describing something unbuilt is actively misleading.

## Verification before merge

```bash
pnpm --filter @repo/schemas-types build   # if packages/ changed
pnpm --filter backend build               # backend's ONLY type gate
pnpm --filter frontend check-types && pnpm --filter frontend build
pnpm --filter admin check-types && pnpm --filter admin build
```

Root `pnpm check-types` does **not** cover the backend (no such script) and skips `@repo/utilities` (its script is named `type-check`). Do not treat a green root run as full coverage.

## Boundaries

- **Never commit secrets, tokens, or credentials.** Not in code, not in a doc, not in a test fixture. Client-visible config only under `NEXT_PUBLIC_*`; anything else is server-only.
- No new dependency when an existing workspace dependency solves it.
- No new architecture without clear need — follow the existing pattern in that surface.
- Do not change app-wide theming, layout, or state management without being asked.
- Prefer shared packages over copy-paste; keep exports stable and update consumers in the same change.
- Do not edit generated output (`dist/`, `drizzle/migrations/*.sql`, `drizzle/migrations/meta/`).
- Destructive DB operations are surfaced to the user, never applied silently.

## Architecture discovery

When `graphify-out/` exists, read `graphify-out/GRAPH_REPORT.md` (and `wiki/index.md` if present) before grepping raw files. Run `graphify update .` after modifying code in a session.
