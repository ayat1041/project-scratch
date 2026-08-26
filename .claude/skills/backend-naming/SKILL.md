---
name: backend-naming
description: Cross-cutting — naming rules for files, folders, symbols, types, constants, and DB objects in apps/backend. Use before creating a file or exporting a symbol in any backend layer, and when reviewing a diff for convention drift.
---

# Backend Naming

Full reference: `.github/instructions/backend-naming-conventions.instructions.md` and `api-workflow.instructions.md` §9. This is the working set.

## Cheat sheet

| Thing | Convention | Example |
|---|---|---|
| File | `entity-action.role.ts` | `api-key-revoke.controller.ts` |
| Directory | `kebab-case` | `swagger-docs/` |
| Feature folder | `F<NNNN>-<feature-name>` | `F6003-api-keys` |
| Route file | `<feature-name>.routes.ts` | `api-keys.routes.ts` |
| Controller file | `<action>-<resource>.controller.ts` | `update-api-key-name.controller.ts` |
| Service file | `<action>-<resource>.service.ts` | `create-api-key.service.ts` |
| Domain read | `<resource>-queries.model.ts` | `api-keys-queries.model.ts` |
| Domain write | `<resource>-commands.model.ts` | `api-keys-commands.model.ts` |
| Policy file | `<domain>.policy.ts` | `user-management.policy.ts` |
| Validation file | `<feature>.schema.ts` in `validations/` | `api-key.schema.ts` |
| Swagger doc | `<action>-<resource>.swagger.ts` | `get-api-key-status.swagger.ts` |
| Persistence helper | `<feature>.persistence.ts` | DB writes **plus** audit/event/failure writes |
| Repository | `<feature>.repository.ts` | narrow CRUD for one aggregate |
| Pure helper | `<feature>.utils.ts` | no IO |
| Local types | `<feature>.types.ts` | not shared outside the feature |
| Test file | source-mirroring `.test.ts` | `update-api-key-name.service.test.ts` |
| Variable | `camelCase` | `eligibleApiKeys` |
| Boolean | `is` / `has` / `can` prefix | `isEligibleToTakeAction` |
| Array | plural | `eligibleIds` |
| Function | `camelCase`, verb-first | `createApiKeyService` |
| Controller export | `{verb}{Entity}Controller` | `revokeApiKeysController` |
| Service export | `{verb}{Entity}Service` | `revokeApiKeysService` |
| Policy action | `can<Action><Entity>` or `is<Condition>` | `canRevokeApiKey`, `isOwnerOrAdminWithAdvancedPermission` |
| Existence check | `<resources>Exist` | `apiKeysExist` |
| List read | `get<Resources>List` | `getApiKeysList` |
| Module constant | `SCREAMING_SNAKE_CASE` | `REMOVABLE_STATUSES` |
| Type / interface | `PascalCase` | `ResolvedApiKey` |
| Class | `PascalCase` | `ApiKeyRegistry` |
| DB table variable | `camelCase` + `Table` suffix | `appApiKeysTable` |
| DB table name | `app_` prefix, snake_case | `app_api_keys` |
| Env variable | `SCREAMING_SNAKE_CASE` | `FRONTEND_URL` |
| Queue name | `kebab-case` string | `"api-key-revoke-queue"` |
| Routing key | dotted lowercase | `"user-management.api-key.revoked"` |

## Shared contract names (`@repo/schemas-types`)

Used verbatim across backend, frontend, and admin — never aliased at the import site:

| Artifact | Pattern |
|---|---|
| Zod schema VALUE | `<Domain><Feature>PayloadValidationSchema` |
| Inferred request TYPE | `<Domain><Feature>PayloadType` |
| Response interface | `<Domain><Feature>ResponseType` or `<Feature>ApiResponse` |
| Entity type (Drizzle-derived) | `App<Entity>` — `AppUsers`, `AppRoles` |
| Status labels | `<FEATURE>_STATUS_LABELS` |

## The file-suffix decision

When splitting helpers inside a feature's `services/`:

| Contains | Suffix |
|---|---|
| DB writes **plus** audit/event-log/failure-state writes | `.persistence.ts` |
| Narrow CRUD/query methods for one aggregate | `.repository.ts` |
| Pure functions, no IO | `.utils.ts` |
| Local types and constants not shared | `.types.ts` |

## Folder naming

- Layer folders are plural and kebab-case: `controllers/`, `services/`, `validations/`, `swagger-docs/`, `tests/integration/`.
- **`validations/`**, not `validation/` — one feature uses the singular; that is an outlier, not a precedent.
- A single file of a concern stays at feature root (`<feature>.routes.ts`); it moves into a folder when there are several.
- Feature IDs follow the existing per-domain series: `F1xxx` auth, `F5xxx` common, `F6xxx` user-management, `F9xxx` platform. Check `src/modules/<domain>/` before allocating.

## Import aliases

```typescript
import { isAuthenticated } from "@/middleware/authentication.middleware";
import { PERMISSIONS } from "@repo/constants";
import type { ApiResponse } from "@repo/schemas-types/payload-schemas/common/api-types.schema";
```

`@/` maps to `src/`. Cross-feature imports use `@/modules/...`; imports inside one feature stay relative. Standalone worker processes need `import "module-alias/register"` as their first line or `@/` will not resolve at runtime.

## Checklist

- [ ] File name matches its layer's `entity-action.role.ts` pattern
- [ ] Feature folder uses the correct `F<NNNN>-` series
- [ ] Controller/service exports suffixed `Controller` / `Service`
- [ ] Booleans prefixed, arrays plural, constants screaming snake
- [ ] Domain files split into `-queries.model.ts` / `-commands.model.ts`
- [ ] Helper suffix chosen deliberately: persistence vs repository vs utils vs types
- [ ] Shared contract names used verbatim, no aliasing
- [ ] `@/` alias used for cross-feature imports
