---
description: Create a new shared package under packages/, or change an existing package's public exports, and wire every consumer.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Monorepo Package

## Step 1 — Decide whether a new package is warranted

| Situation | Action |
|---|---|
| Logic duplicated between two apps | Move it to an **existing** package first — `utilities`, `constants`, `ui` |
| A new Zod schema or response type | `@repo/schemas-types` — not a new package |
| A new runtime enum or permission | `@repo/constants` — not a new package |
| A new shared React component | `@repo/ui` — not a new package |
| A genuinely new, cohesive concern with several exports | New package — continue |

A package per helper is churn. State why an existing package does not fit before creating one.

## Step 2 — Required reading

- Skill `monorepo-packages`
- `packages/create-new-package.md` — the source of truth for scaffolding
- An existing package of the same type, as the shape to mirror

## Step 3 — Pick the type

| Type | Build? | Exports | Mirror |
|---|---|---|---|
| Build-required (TS library) | ✅ `tsc` → `dist/` | `main` + `types` → `dist/` | `@repo/schemas-types`, `@repo/constants`, `@repo/utilities` |
| Source-only (React) | ❌ | `exports` map → `src/` | `@repo/ui`, `@repo/styles` |
| Config | ❌ | named config files | `@repo/eslint-config`, `@repo/typescript-config` |

## Step 4a — Create

1. `packages/<kebab-name>/src/`
2. `package.json`: `"@repo/<name>"`, `"private": true`, `"version": "0.0.0"`, scripts for the chosen type
3. `tsconfig.json` extending `@repo/typescript-config/base.json` (or `react-library.json`); for a library set `outDir: ./dist`, `rootDir: ./src`, `declaration: true`
4. `src/index.ts` — an **intentional** public API, not `export *` from everything
5. Optional `eslint.config.mjs` extending `@repo/eslint-config/base`, ignoring `dist/**`
6. Add `"@repo/<name>": "workspace:*"` to each consuming app, then `pnpm install` from the root
7. `pnpm --filter @repo/<name> build` if build-required

`turbo.json` needs no change — `^build` already covers it.

**Name the script `check-types`, not `type-check`.** `@repo/utilities` uses the latter and is consequently skipped by the root `pnpm check-types`; do not copy that mistake.

## Step 4b — Change an existing package

1. Grep every consumer of the exports you are touching, across `apps/*` and `packages/*`, **before** editing.
2. Prefer additive change: add the new export, migrate consumers, then remove the old one.
3. Edit `src/**`.
4. Rebuild if build-required.
5. Update every consumer **in this same change** — a renamed or removed export that ships without its call sites breaks three apps.

## Step 5 — Constraints

- Internal dependencies use `workspace:*`, never a version range
- No circular dependencies — the spine is configs → `constants`/`utilities` → `schemas-types` → apps, with `ui`/`styles` feeding the Next.js apps
- No new external dependency when an existing workspace dependency solves it
- Packages stay `"private": true`
- Never edit `dist/` — regenerate
- `@repo/validations` and `@repo/types` do not exist; some instruction files still name them

## Step 6 — Verify

```bash
pnpm install
pnpm --filter @repo/<name> build        # if build-required
pnpm --filter @repo/<name> check-types  # if it has one
pnpm --filter backend build             # backend has NO check-types script
pnpm --filter frontend check-types
pnpm --filter admin check-types
```

For a cross-cutting change, also `pnpm build` from the root.

## Step 7 — Report

- Package name, type, and public API.
- Why an existing package did not fit (for a new package).
- Consumers wired or updated, per app.
- Any consumer left broken, named explicitly.
- Whether `pnpm install` was needed and run.
