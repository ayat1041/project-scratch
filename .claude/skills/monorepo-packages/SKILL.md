---
name: monorepo-packages
description: Creating and changing shared packages under packages/. Use when adding a package, changing a package's public exports, adding a dependency, or reconciling consumers after a package change. Covers the three package types, build order, and the export-stability rule.
---

# Shared Packages (`packages/`)

A change here can affect three apps at once. The governing rule: **if exports change, update every consumer in the same change.**

## The three package types

| Type | Build? | Exports from | Examples |
|---|---|---|---|
| **Build-required** (TS library) | ✅ `tsc` → `dist/` | `main`/`types` pointing at `dist/` | `@repo/schemas-types`, `@repo/constants`, `@repo/utilities` |
| **Source-only** (React) | ❌ | `exports` mapping straight to `src/` | `@repo/ui`, `@repo/styles` |
| **Config** | ❌ | named config files | `@repo/eslint-config`, `@repo/typescript-config` |

A build-required package is invisible to consumers until it is built. That is the single most common cause of "my new type doesn't exist".

## Creating a package

Follow `packages/create-new-package.md` — it is the source of truth for scaffolding. In outline:

1. `packages/<name>/src/`, kebab-case name, `@repo/` namespace, `"private": true`.
2. `package.json` for the chosen type — `main`/`types` + `build` script for a library; an `exports` map for source-only.
3. `tsconfig.json` extending `@repo/typescript-config/base.json` (or `react-library.json`), `outDir: dist`, `rootDir: src`, `declaration: true` for libraries.
4. `src/index.ts` with an intentional public API — export what consumers need, not everything.
5. `workspace:*` in the consuming app's dependencies, then `pnpm install` from the root.
6. `pnpm --filter @repo/<name> build` if it is build-required.

Turbo's `^build` already covers a new build step; no `turbo.json` change is needed.

Before creating: check whether an existing package already fits. A new package for one function is churn — three or four exist that probably belong to it.

## Changing an existing package

```bash
# 1. edit packages/<name>/src/**
# 2. build it (build-required only)
pnpm --filter @repo/<name> build

# 3. reconcile every consumer
pnpm --filter frontend check-types
pnpm --filter admin check-types
pnpm --filter backend build        # backend has NO check-types script
```

Grep for the changed export across `apps/backend`, `apps/frontend`, `apps/admin`, and other packages before assuming a change is local. Report any consumer left broken by name — a silently broken sibling app is not an acceptable outcome even when the task named only one app.

## Export stability

- Keep the public API stable. A rename is a breaking change to three apps.
- Removing or renaming an export requires updating every call site in the same change.
- Prefer additive change: add the new export, migrate consumers, then remove the old one.
- Be intentional about `index.ts` — exporting everything makes every internal a public contract you cannot change later.

## Dependencies

- Internal packages use `workspace:*`, never a version range.
- No new external dependency if an existing workspace dependency already solves it.
- No circular dependencies between packages. The spine is: configs → `constants`/`utilities` → `schemas-types` → apps, with `ui`/`styles` feeding the two Next.js apps.
- Packages stay `"private": true` — this monorepo does not publish.

## Script naming — a real inconsistency

`@repo/utilities` exposes **`type-check`**, while everything else uses **`check-types`**. `pnpm check-types` at the root therefore skips it. Run it explicitly when changing that package, and prefer `build` as the gate for build-required packages.

## Never edit

- `dist/` — regenerate via the package's build script.

## Packages that do not exist

`@repo/validations` and `@repo/types` are referenced by `packages/AGENTS.md`, `api-workflow.instructions.md`, `get-list-service.instructions.md`, and the `review-impact-frontend` command. **Neither is in the tree and neither is imported anywhere.** Zod schemas and response/entity types live in `@repo/schemas-types`; runtime enums and permissions in `@repo/constants`. Treat any instruction pointing at those two as stale.

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Editing a package and not rebuilding it | `pnpm --filter @repo/<name> build` |
| Changing an export without updating consumers | Same change, all three apps |
| Logic copy-pasted between two apps | Move it to a package |
| App-specific logic pushed into a package | Keep it in its app |
| New package for a single helper | Extend an existing one |
| Version range for an internal dependency | `workspace:*` |
| Editing `dist/` | Regenerate |
| `export *` from every internal file | Curate the public API |

## Checklist

- [ ] Correct package type chosen; `package.json` and `tsconfig.json` match it
- [ ] `@repo/` name, kebab-case, `"private": true`
- [ ] Public API in `index.ts` is intentional
- [ ] `workspace:*` used for internal dependencies; no cycles
- [ ] Package built (if build-required)
- [ ] Every consumer across all three apps reconciled and reported
- [ ] `pnpm --filter frontend check-types`, `pnpm --filter admin check-types`, `pnpm --filter backend build` all pass
