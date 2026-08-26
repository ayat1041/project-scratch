---
description: Add or change a shared Zod payload schema, response type, or constant in @repo/schemas-types / @repo/constants, then rebuild and reconcile every consumer.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Contract (L0)

Contracts are cross-app. This command touches `packages/`, so it affects `apps/backend` and `apps/admin` as well as `apps/frontend`.

## Step 1 — Gather inputs

- Domain and feature (maps to `payload-schemas/<domain>/<feature>/`)
- For each request: field names, types, validation rules, and the **exact user-facing error message** per rule
- For each response: the full shape, including nullability
- Any runtime enum / option array the backend also needs

## Step 2 — Required reading

- Skill `frontend-contracts`
- `apps/frontend/instructions/type-flow.instructions.md` §8

## Step 3 — Check for an existing contract first

Grep `packages/schemas-types/src` for the entity and for near-miss names. Extending an existing schema beats adding a parallel one. If a type already exists, stop and report it — the correct action is to import it, not to add another.

## Step 4 — Write the schema

`packages/schemas-types/src/payload-schemas/<domain>/<feature>/payload.schema.ts`:

- Schema VALUE: `export const <Domain><Feature>PayloadValidationSchema = z.object({ ... })`
- Inferred TYPE: `export type <Domain><Feature>PayloadType = z.infer<typeof ...>` — co-located
- Every rule carries a `{ message: '...' }` — this copy is what all three apps render
- `sanitizeHtml` goes inside `.transform()`, never in a service
- `export const`, never `export default`

`response.schema.ts`: plain TypeScript interfaces named `<Domain><Feature>ResponseType` / `<Feature>ApiResponse`. No Zod unless the response is validated on intake.

Shared runtime enums and option arrays → `packages/constants/src/<domain>/`.

## Step 5 — Build the package (gate)

```bash
pnpm --filter @repo/schemas-types build
```

Must pass before any app code is touched. If it fails, fix it here — do not work around it downstream.

## Step 6 — Reconcile consumers

```bash
pnpm --filter frontend check-types
```

For a **changed** (not new) contract, also grep for existing consumers across `apps/backend`, `apps/admin`, and `apps/frontend` and list every one that breaks. Report them even if the task only covers the frontend — a silently broken sibling app is not an acceptable outcome.

## Step 7 — Wire the frontend call sites

Import directly at the call site, canonical name, no alias:

```typescript
import { UserManagementUpdateNamePayloadValidationSchema } from '@repo/schemas-types/payload-schemas/user-management/api-keys/payload.schema';
import type { UserManagementUpdateNamePayloadType } from '@repo/schemas-types/payload-schemas/user-management/api-keys/payload.schema';
```

Do **not** add re-exports to `types/domain.ts` or `validations/schemas.ts` — those files hold local code only.

Values use `import`; types use `import type`. A schema passed to `zodResolver` under `import type` compiles and then throws at runtime.

## Step 8 — Verify

```bash
pnpm --filter @repo/schemas-types build
pnpm --filter frontend check-types
pnpm --filter frontend lint
```

## Step 9 — Report

- Schemas/types added or changed, with their canonical names.
- Consumers updated, per app.
- Consumers still broken, if any, named explicitly.
- Next: `/frontend-api`.
