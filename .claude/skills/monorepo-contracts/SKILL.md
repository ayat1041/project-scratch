---
name: monorepo-contracts
description: The cross-app contract in @repo/schemas-types — the single spine shared by backend, frontend, and admin. Use when a change spans the API boundary: a new endpoint payload, a response shape, an entity type, a status enum, or a display label. Covers the full-stack implementation order and consumer reconciliation.
---

# Cross-App Contracts

`@repo/schemas-types` is the one place backend, frontend, and admin agree. A change here is a change to three apps.

For the per-app consumption rules see `frontend-contracts` (also applies to admin) and `backend-validation`. This skill covers the **cross-app** flow.

## What lives where

```
packages/schemas-types/src/
├── tables/                  App* entity types mirrored from Drizzle; entity-types.ts is the hub
├── constants/               pagination limits, timezone offsets, status sets, STATUS_LABELS
└── payload-schemas/<domain>/<feature>/
    ├── payload.schema.ts    Zod request schemas (VALUES) + inferred request TYPES
    └── response.schema.ts   plain TypeScript response interfaces

packages/schemas-types/src/payload-schemas/common/api-types.schema.ts
    ApiResponse<T>           ← CANONICAL discriminated union, imported by all three apps
```

`@repo/constants` holds runtime enums and `PERMISSIONS`.

## Who authors what

| Artifact | Authored by | Consumed by |
|---|---|---|
| Zod payload schema + message text | Backend feature author | Backend validation, frontend forms, admin forms |
| Response type | Backend feature author | Frontend/admin `api/` and services |
| `App*` entity type | Follows the Drizzle schema | All three |
| Status enum / union | Backend | All three |
| `<FEATURE>_STATUS_LABELS` | Backend | Returned in list `counts`; clients render the label, never their own copy |
| `PERMISSIONS` key | Backend | Backend routes, admin permission UI |

**Error message copy is authored once, in the schema.** That is what makes a 422 read identically in the API, the frontend form, and the admin panel.

## Full-stack implementation order

```
1. packages/schemas-types    payload.schema.ts + response.schema.ts
   packages/constants        enums, PERMISSIONS
        ↓  pnpm --filter @repo/schemas-types build      ← GATE
        ↓  pnpm --filter @repo/constants build
2. apps/backend              db schema → migration → domain query → policy → route/controller/service → swagger
        ↓  pnpm --filter backend build                  ← GATE
3. apps/frontend / apps/admin   api → service → handler → hook/Presenter → component → page
        ↓  pnpm --filter frontend check-types
        ↓  pnpm --filter admin check-types              ← GATE
```

Contracts first, always. Writing the frontend against a shape the backend has not committed to produces two divergent truths and a painful merge.

## The value / type split

| Face | What | Import |
|---|---|---|
| Schema **VALUE** | `z.ZodObject` runtime object — `zodResolver`, `.parse()`, `validateZodSchema` | plain `import` |
| Inferred **TYPE** | `z.infer<typeof Schema>`, erased | `import type` |

`import type` on a schema then passed to a validator compiles cleanly and throws at runtime. Check this first whenever a form "type-checks but explodes on mount".

## Naming — verbatim across three apps

| Artifact | Pattern |
|---|---|
| Zod schema VALUE | `<Domain><Feature>PayloadValidationSchema` |
| Inferred request TYPE | `<Domain><Feature>PayloadType` |
| Response interface | `<Domain><Feature>ResponseType` / `<Feature>ApiResponse` |
| List response | `<Domain><Feature>ListResponse` |
| Entity type | `App<Entity>` |

`import { X as Y }` is forbidden — two names for one thing, and grep stops working across the repo.

## `ApiResponse<T>` is the wire envelope

```typescript
import type { ApiResponse } from '@repo/schemas-types/payload-schemas/common/api-types.schema';

if (!response.success) throw createApiError(response.message, 500);
response.data.field;   // narrowed
```

The backend returns `{ success, message, data? }` from every controller; both clients narrow on it. A bespoke response shape in either direction breaks narrowing on the other side. `response.data?.field` without narrowing masks a real type error.

## Changing an existing contract

1. Grep every consumer across `apps/backend`, `apps/frontend`, `apps/admin` **before** editing.
2. Prefer additive: add the new field/schema, migrate consumers, then remove the old.
3. Edit, build the package, then run all three type gates.
4. Report every consumer that broke — including in apps the task did not name.

A field the backend adds is invisible to clients until `@repo/schemas-types` is rebuilt. A field a client expects that the backend never sends type-checks fine and is `undefined` at runtime — which is why the response type and the controller's actual payload must be changed together.

## Local files that are NOT contract homes

- Frontend/admin `types/domain.ts` — **local** types and composite DTOs only. Never re-export package types.
- Frontend/admin `validations/schemas.ts` — UI-only constants and local Zod only. Never re-export package schemas.
- Backend feature `validations/` — backend-only schemas. Anything a client sends belongs in the package.

Re-exporting a package type through a local file creates an alias that drifts from the contract.

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Client writes its own copy of a backend validation rule | One schema in the package |
| Client keeps its own filter/status display strings | Render `label` from the backend's `counts` |
| Type redefined locally when it exists in the package | Import it |
| Contract edited without rebuilding the package | `pnpm --filter @repo/schemas-types build` |
| Frontend built before the backend contract is settled | Contracts first |
| `import { X as Y }` from the package | Canonical name |
| Bespoke `{ success, data?, message }` on either side | `ApiResponse<T>` |
| Package types re-exported via `types/domain.ts` | Import at the call site |
| Import from `@repo/validations` | Not real — use `@repo/schemas-types` |

## Checklist

- [ ] Contract authored in `@repo/schemas-types` before any app code
- [ ] Schema VALUE + inferred TYPE co-located; canonical names; explicit messages
- [ ] Response types are plain interfaces in `response.schema.ts`
- [ ] Shared enums and `PERMISSIONS` in `@repo/constants`
- [ ] Status labels shared, not re-typed per client
- [ ] `pnpm --filter @repo/schemas-types build` passes
- [ ] Backend returns `{ success, message, data }`; both clients narrow before `.data`
- [ ] Every consumer in all three apps reconciled, and any left broken named explicitly
- [ ] `backend build`, `frontend check-types`, `admin check-types` all pass
