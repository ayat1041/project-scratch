---
description: Change a shared contract in @repo/schemas-types or @repo/constants and reconcile every consumer across backend, frontend, and admin in the same change.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Monorepo Contract Change

A contract change is never single-app. Three consumers exist; this command makes you check all of them.

## Step 1 — Gather inputs

- The artifact: payload schema, response type, entity type, status enum, display labels, or permission
- What is changing: add a field, change a rule, rename, remove
- Why — the driving requirement

## Step 2 — Required reading

- Skill `monorepo-contracts`
- Skill `monorepo-packages`
- `apps/frontend/instructions/type-flow.instructions.md` §8

## Step 3 — Inventory consumers BEFORE editing

Grep the current name across all three apps and the other packages:

```bash
grep -rn "<ArtifactName>" --include=*.ts --include=*.tsx apps packages | grep -v node_modules
```

Produce the list up front. Editing first and discovering consumers afterwards is how a sibling app ends up broken on `main`.

## Step 4 — Classify the change

| Change | Approach |
|---|---|
| **Additive** — new optional field, new schema, new enum member | Safe. Edit, build, then adopt in consumers |
| **Widening** — a rule becomes more permissive | Safe for clients; confirm the backend accepts it |
| **Narrowing** — a rule becomes stricter, a field becomes required | Breaking. Every producer must be updated **before** the rule ships |
| **Rename / remove** | Breaking. Prefer additive-then-migrate-then-remove across steps rather than an in-place rename |

State the classification. For anything breaking, say explicitly what would fail if it shipped half-applied.

## Step 5 — Edit the contract

- Schema VALUE and inferred TYPE stay co-located in `payload.schema.ts`; canonical `<Domain><Feature>PayloadValidationSchema` / `PayloadType` names.
- Response types are plain interfaces in `response.schema.ts`.
- Entity types in `tables/` follow the Drizzle schema — if the DB is changing too, `/db-change` comes first.
- Runtime enums and `PERMISSIONS` in `@repo/constants`.
- Every validation rule carries an explicit `{ message }` — that copy is rendered by all three apps.
- Status display labels are shared, so no client keeps its own strings.

## Step 6 — Build the packages (gate)

```bash
pnpm --filter @repo/schemas-types build
pnpm --filter @repo/constants build
```

Must pass before touching any app. A build-required package is invisible to consumers until it is built.

## Step 7 — Reconcile every consumer

```bash
pnpm --filter backend build          # backend has NO check-types script
pnpm --filter frontend check-types
pnpm --filter admin check-types
```

Work through the failures per app. Rules while doing so:

- Import directly at the call site, canonical name, **no `as` alias**.
- Values with `import`, types with `import type` — `import type` on a schema passed to `zodResolver` compiles and throws at runtime.
- Do **not** add re-exports to a client's `types/domain.ts` or `validations/schemas.ts` — those hold local code only.
- A backend response type change means the controller's actual payload changes too; a type that promises a field nobody sends type-checks fine and is `undefined` at runtime.

## Step 8 — Check the non-type consumers

Type-checking will not catch these — grep for them:

- Swagger docs describing the old request/response shape (`swagger-docs/*.swagger.ts`)
- Tests asserting the old message text or the old shape
- Display strings a client hardcoded instead of reading from `label`
- Seed data or fixtures using a removed enum value

## Step 9 — Verify

```bash
pnpm --filter @repo/schemas-types build
pnpm --filter @repo/constants build
pnpm --filter backend build
pnpm --filter frontend check-types && pnpm --filter frontend build
pnpm --filter admin check-types && pnpm --filter admin build
pnpm --filter backend check:spec-drift
```

## Step 10 — Report

- Artifact changed, with its classification (additive / widening / narrowing / rename).
- Consumers found in Step 3, and what happened to each.
- Non-type consumers updated — swagger, tests, fixtures.
- **Any consumer left broken, named explicitly.** Never report a contract change as complete while a sibling app fails to type-check.
- Whether the schema and its consumers can be committed together.
