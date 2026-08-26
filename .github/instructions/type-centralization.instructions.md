# Type Centralization Standards

## The Single Rule

`packages/schemas-types` is the **only** place types that cross an app boundary may be defined. Backend, admin, frontend, and packages/ui all consume from there. `packages/types` is deprecated and will be deleted — no new imports from it, every existing import is a migration target.

---

# Part 1 — Type Taxonomy (Decision Tree)

For every type you encounter, find its category below and place it in exactly one location. Never create a type in two places.

| Category | Where it lives |
|---|---|
| DB table row shape | `packages/schemas-types/src/tables/<group>/<table>.ts` — exported via `tables/entity-types.ts` |
| Cross-feature API envelope primitive (pagination, counts, supporting docs) | `packages/schemas-types/src/payload-schemas/common/payload.schema.ts` |
| API request / payload schema | `packages/schemas-types/src/payload-schemas/<domain>/<feature>/payload.schema.ts` |
| API response schema (what an endpoint returns) | `packages/schemas-types/src/payload-schemas/<domain>/<feature>/payload.schema.ts` |
| Data-shape type consumed by UI components (describes API data) | `packages/schemas-types/src/payload-schemas/<domain>/<feature>/payload.schema.ts` |
| Auth session / token payload types | `packages/schemas-types/src/payload-schemas/auth/payload.schema.ts` |
| Backend-only domain intermediary types (join shapes, query result shapes) | `apps/backend/src/domain/<domain>/<domain>.types.ts` |
| Purely presentational / UI types (ButtonVariant, ColumnDef, theme tokens) | `packages/ui` or local component file — these do NOT cross the API boundary |
| UI-only sort/filter/local-state types | Local `_types` file in the consuming app — these are NOT API contracts |
| Enum whose values come directly from constants | Use `@repo/constants` — do not redeclare |

**If a type is used in more than one app, it lives in the package. No exceptions.**

---

# Part 2 — Package Structure

```
packages/schemas-types/src/
│
├── tables/                                  ← DB table Zod schemas + entity types
│   ├── entity-types.ts                      ← re-exports every App* entity type
│   ├── user-management/
│   └── common-tables/
│
└── payload-schemas/
    ├── common/
    │   └── payload.schema.ts                ← Pagination, LabeledCount, SupportingDocument,
    │                                           StandardApiResponse, shared field builders
    │
    ├── auth/
    │   └── payload.schema.ts                ← request schemas + SafeUser, AuthUserInfo,
    │                                           AuthSessionData, AuthSignInData, UserInfoPayload
    │
    ├── admin/
    │   ├── permissions/
    │   │   └── payload.schema.ts            ← AdminPermissionListItem, AdminPermissionListResponse, etc.
    │   ├── roles/
    │   │   └── payload.schema.ts
    │   └── languages/
    │       └── payload.schema.ts
    │
    └── user-management/
        ├── user-preferences/
        │   └── payload.schema.ts            ← request + UserPreferencesData, NotificationSettingsType,
        │                                       LocaleSettingsType, etc.
        └── api-keys/
            └── payload.schema.ts            ← ApiKeyListItem, ApiKeyListResponse
```

---

# Part 3 — Naming Conventions

Follow these naming patterns exactly. Consistency lets AI tools and engineers predict the correct import path without searching.

## Schema names (Zod objects)

| Purpose | Pattern | Example |
|---|---|---|
| Request payload schema | `{Domain}{Action}{Resource}PayloadValidationSchema` | `AdminUpdatePermissionStatusPayloadValidationSchema` |
| Query params schema | `{Domain}Get{Resource}QueryPayloadValidationSchema` | `AdminGetAllPermissionRecordsQueryPayloadValidationSchema` |
| Response list item schema | `{Domain}{Resource}ListItemResponseSchema` | `AdminPermissionListItemResponseSchema` |
| Response list counts schema | `{Domain}{Resource}ListCountsSchema` | `AdminPermissionListCountsSchema` |
| Response list envelope schema | `{Domain}{Resource}ListResponseSchema` | `AdminPermissionListResponseSchema` |
| Response single item schema | `{Domain}{Resource}ResponseSchema` | `AdminRoleRecordResponseSchema` |
| Data-shape schema (UI) | `{Domain}{Entity}Schema` | `UserPreferencesDataSchema`, `LocaleSettingsSchema` |

## Inferred type names

Each schema exports one inferred type with `Type` appended:

```ts
export const AdminPermissionListResponseSchema = z.object({ ... });
export type AdminPermissionListResponse = z.infer<typeof AdminPermissionListResponseSchema>;
```

| Pattern | Example |
|---|---|
| Request payload type | `{Domain}{Action}{Resource}PayloadValidationSchemaType` |
| Response list item type | `{Domain}{Resource}ListItemResponse` |
| Response list counts type | `{Domain}{Resource}ListCounts` |
| Response list envelope type | `{Domain}{Resource}ListResponse` |
| Response single item type | `{Domain}{Resource}Response` |
| Data-shape type (UI) | `{Domain}{Entity}` | `UserPreferencesData`, `LocaleSettingsData` |

## Internal file organization per `payload.schema.ts`

Always organize sections in this order inside every `payload.schema.ts` file:

```
1. Imports
2. ─── Common field builders (if needed) ────
3. ─── Request / payload schemas (GET query, POST body, PATCH body) ────
4. ─── Response schemas ────
5. ─── Data-shape schemas (UI-consumed) ────
```

---

# Part 4 — Common Envelope Types (packages/schemas-types/src/payload-schemas/common/)

These primitives are already defined. Use them everywhere — never inline their shapes.

| Export | Shape | Use case |
|---|---|---|
| `Pagination` / `PaginationSchema` | `{ limit, offset, totalItems, totalPages }` | All paginated list responses |
| `LabeledCount` / `LabeledCountSchema` | `{ label: string; value: string; count: number }` | Filter/tab count arrays |
| `SupportingDocument` / `SupportingDocumentSchema` | `{ title, description, mediaUrl, mediaType }` | Media attachments on records |
| `StandardApiResponse` / `StandardApiResponseSchema` | `{ success: boolean; message: string; data? }` | Simple success/error envelopes |

If a new shared primitive is needed, add it here first. Do not define it inline in any feature file or app.

---

# Part 5 — Per-Category Rules with Examples

## 5.1 DB Entity Types

Already centralized in `tables/entity-types.ts`. Import path:

```ts
import type { AppPermissions, AppRoles } from "@repo/schemas-types/tables/entity-types";
```

Never import entity types from `@repo/types`.

## 5.2 API Request / Payload Schemas

Compose from table fields. Never redefine table-level constraints manually.

```ts
// BAD — in any service, controller, or _types file
const schema = z.object({
  permissionName: z.string().min(2, "Minimum 2 characters required."),
});

// GOOD — in packages/schemas-types/src/payload-schemas/admin/permissions/payload.schema.ts
const permissionNameField = appPermissionsSchema.shape.permissionName
  .unwrap().unwrap()
  .min(2, { error: "Minimum 2 characters required." });

export const AdminCreatePermissionPayloadValidationSchema = z.object({
  permissionName: permissionNameField,
  ...
});
export type AdminCreatePermissionPayloadValidationSchemaType =
  z.infer<typeof AdminCreatePermissionPayloadValidationSchema>;
```

## 5.3 API Response Schemas

Every list endpoint response must be a Zod schema + inferred type in the feature's `payload.schema.ts`.

```ts
// BAD — in apps/backend/.../get-all-permissions.service.ts
type AdminPermissionListResult = {
  success: true;
  message: string;
  pagination: { limit: number; offset: number; totalItems: number; totalPages: number };
  counts: { categoryTypesCount: { label: string; value: string; count: number }[] };
  data: AdminPermissionListItem[];
};

// GOOD — in packages/schemas-types/src/payload-schemas/admin/permissions/payload.schema.ts
import { PaginationSchema, LabeledCountSchema, SupportingDocumentSchema } from "../../common/payload.schema";

export const AdminPermissionListItemResponseSchema = z.object({ ... });
export type AdminPermissionListItemResponse = z.infer<typeof AdminPermissionListItemResponseSchema>;

export const AdminPermissionListCountsSchema = z.object({
  categoryTypesCount: z.array(LabeledCountSchema),
  statusTypesCount: z.array(LabeledCountSchema),
});
export type AdminPermissionListCounts = z.infer<typeof AdminPermissionListCountsSchema>;

export const AdminPermissionListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  pagination: PaginationSchema,
  counts: AdminPermissionListCountsSchema,
  data: z.array(AdminPermissionListItemResponseSchema),
});
export type AdminPermissionListResponse = z.infer<typeof AdminPermissionListResponseSchema>;
```

Backend service return type:

```ts
// BAD
export const getAllPermissionsService = async (...): Promise<AdminPermissionListResult> => {

// GOOD
import type { AdminPermissionListResponse } from "@repo/schemas-types/payload-schemas/admin/permissions/payload.schema";
export const getAllPermissionsService = async (...): Promise<AdminPermissionListResponse> => {
```

## 5.4 UI Data-Shape Types

Types describing data that flows from API into UI components belong in the package, not in `packages/ui/types/`.

```ts
// BAD — packages/ui/src/components/user/preferences/types/UserPreferencesDataType.ts
export interface UserPreferencesDataType {
  displayName: string;
  avatarUrl: string | null;
  timezone: string | null;
  ...
}

// GOOD — packages/schemas-types/src/payload-schemas/user-management/user-preferences/payload.schema.ts
export const UserPreferencesDataSchema = z.object({
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  timezone: z.string().nullable(),
  ...
});
export type UserPreferencesData = z.infer<typeof UserPreferencesDataSchema>;
```

`packages/ui` components then import the type from `@repo/schemas-types`, not define it themselves.

## 5.5 Auth Session / Token Types

```ts
// BAD — apps/frontend/.../domain.ts
export interface AuthUserInfo {
  id: string;
  email: string;
  ...
}

// GOOD — packages/schemas-types/src/payload-schemas/auth/payload.schema.ts
export const AuthUserInfoSchema = z.object({
  id: z.uuid(),
  email: z.string().email(),
  ...
});
export type AuthUserInfo = z.infer<typeof AuthUserInfoSchema>;
```

## 5.6 Backend Domain Intermediary Types

Types used only inside backend domain layers (join shapes, query result shapes) stay in the backend:

```ts
// apps/backend/src/domain/user-management/roles/role.types.ts
export type RoleRow = typeof appRolesTable.$inferSelect;
export type RolePermissionResult = Pick<RolePermissionRow, "id" | "roleId" | ...> & { permissionName: string | null };
```

These are NOT exported to the package because they are not API contracts.

## 5.7 App `_types` Files (admin / frontend)

`_types` files must be thin re-export (alias) modules only. They do not define shapes.

```ts
// BAD — apps/admin/.../_types/index.ts
import { ApiSuccessResponse, PAGINATION } from '@repo/types';
export interface PermissionsApiResponse extends ApiSuccessResponse<...> {
  pagination: PAGINATION;
  counts: ...;
}

// GOOD — apps/admin/.../_types/index.ts
import type {
  AdminPermissionListResponse,
  AdminPermissionListItemResponse,
  AdminPermissionListCounts,
} from '@repo/schemas-types/payload-schemas/admin/permissions/payload.schema';
import type { SupportingDocument } from '@repo/schemas-types/payload-schemas/common/payload.schema';

export type PermissionsApiResponse = AdminPermissionListResponse;
export type PermissionRecordBaseResponse = AdminPermissionListItemResponse;
export type PermissionCountsType = AdminPermissionListCounts;
export type SupportingDocumentType = SupportingDocument;

// UI-only types (not API contracts) may remain local:
export enum PERMISSION_CATEGORY_TYPES { ... }
export type SortField = 'category' | 'source' | ...;
```

---

# Part 6 — Strict Bans

These patterns are violations regardless of where they appear.

### Ban 1 — No imports from `@repo/types`

```ts
// BANNED everywhere
import { ApiSuccessResponse, PAGINATION, SupportingDocumentType } from '@repo/types';
import type { AppPermissions } from '@repo/types';
```

Replace with imports from `@repo/schemas-types`.

### Ban 2 — No inline pagination / count / document shapes

```ts
// BANNED — inline in service, controller, domain.ts, _types, component
pagination: {
  limit: number;
  offset: number;
  totalItems: number;
  totalPages: number;
}
{ label: string; value: string; count: number }[]
{ title: string; description: string; mediaUrl: string; mediaType: string }
```

Use `Pagination`, `LabeledCount[]`, `SupportingDocument[]` from the package.

### Ban 3 — No local response type declarations in service files

```ts
// BANNED — in any .service.ts file
type AdminPermissionListResult = { success: true; message: string; ... };
interface UpdatePermissionServiceResult { ... }
```

Response types are defined in the package. Services import and return them.

### Ban 4 — No local shape definitions in admin/frontend `_types` files

```ts
// BANNED — in apps/admin or apps/frontend _types files
export interface PermissionsApiResponse { ... }
export interface RoleRecordBaseResponse { ... }
```

### Ban 5 — No duplicate status enums

```ts
// BANNED — redeclaring in admin/frontend when constants exist
export enum ROLE_STATUS_TYPES {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ...
}
```

Use `ROLE_STATUSES` from `@repo/constants`. UI display enums belong in the local `_types` file only if they are UI-label mappings, not status value declarations.

### Ban 6 — No data-shape types in `packages/ui/types/`

```ts
// BANNED — packages/ui/src/components/user/preferences/types/UserPreferencesDataType.ts
export interface UserPreferencesDataType { ... }
```

Data shapes that describe API data belong in `@repo/schemas-types`. `packages/ui` components import from there.

### Ban 7 — Labels must resolve to `string | null`, never `string | undefined`

```ts
// BANNED
label: Object.values(CATEGORY_TYPES).find(ct => ct.VALUE === value)?.LABEL

// REQUIRED
label: Object.values(CATEGORY_TYPES).find(ct => ct.VALUE === value)?.LABEL ?? null
```

---

# Part 7 — Module Migration Procedure

AI tools must follow these exact steps for every module. Do not skip steps. Do not migrate multiple modules at once.

## Step 0 — Read before touching

Before migrating a module, read:
- The existing `payload.schema.ts` in the package for that module
- The backend service file(s) for that module
- The admin/frontend `_types` file for that module
- The `packages/types/src/modules/<domain>/response-types.ts` for that module

## Step 1 — Add response schemas to the package

Open `packages/schemas-types/src/payload-schemas/<domain>/<feature>/payload.schema.ts`.

Add, in order:
1. Response item schema (fields the endpoint returns per record)
2. Counts schema (if the endpoint returns filter counts — use `LabeledCountSchema`)
3. List response envelope schema (uses `PaginationSchema`, counts schema, item schema array)
4. Export all inferred types

Compose from:
- `tables/` fields for entity-derived fields
- `payload-schemas/common/payload.schema.ts` for `PaginationSchema`, `LabeledCountSchema`, `SupportingDocumentSchema`
- Table field shapes for dates, nullables, UUIDs

## Step 2 — Build the package

```bash
pnpm --filter "@repo/schemas-types" build
```

Must pass before touching any consuming app. Fix all errors before continuing.

## Step 3 — Migrate the backend service

In the backend `.service.ts` file:

1. Remove all local `type` and `interface` declarations
2. Remove all `import ... from "@repo/types"` lines
3. Add imports from `@repo/schemas-types/payload-schemas/<domain>/<feature>/payload.schema`
4. Add the centralized response type as the function's `Promise<>` return type
5. Replace any inline `SupportingDocumentType` usages with `SupportingDocument`
6. Add `?? null` to any label lookups that could return `undefined`

## Step 4 — Build the backend

```bash
pnpm --filter backend build
```

Must pass. Fix all TypeScript errors before continuing.

## Step 5 — Migrate the admin `_types` file

In `apps/admin/app/dashboard/.../_resources/_types/index.ts` (or `domain.ts`):

1. Remove all local interface/type shape definitions
2. Remove all `import ... from "@repo/types"` lines
3. Add imports from `@repo/schemas-types/payload-schemas/<domain>/<feature>/payload.schema`
4. Add type aliases re-exporting the centralized types under the existing local names
5. Leave UI-only types in place (sort fields, local enums that map display labels)

## Step 6 — Migrate the frontend `_types` file

Same as Step 5 but in `apps/frontend/app/.../_resources/_types/domain.ts`.

## Step 7 — Migrate `packages/ui` component types

For every type file under `packages/ui/src/components/<domain>/profile/types/`:

1. Move the interface into the matching `payload.schema.ts` in the package as a Zod schema + inferred type
2. In the `packages/ui` type file, replace the local definition with a re-export alias:
   ```ts
   export type { UserPreferencesData as UserPreferencesDataType } from '@repo/schemas-types/payload-schemas/user-management/user-preferences/payload.schema';
   ```
3. Update any `packages/ui` component that imports from the local types file — keep import path unchanged, it now flows through the re-export.

## Step 8 — Type-check all apps

```bash
pnpm --filter backend build
pnpm --filter admin run check-types
pnpm --filter frontend run check-types
pnpm --filter "@repo/ui" run check-types
```

All must pass. Fix errors before marking the module done.

## Step 9 — Lint

```bash
pnpm --filter admin run lint
pnpm --filter frontend run lint
```

No new errors introduced.

---

# Part 8 — Module Migration Order

Migrate in this order. Each item is one migration unit (one pass of Steps 0–9).

### Phase 1 — Common & Auth (foundation)
1. `auth` — SafeUser, AuthUserInfo, AuthSessionData, AuthSignInData, UserInfoPayload

### Phase 2 — Admin core features
2. `admin/permissions` — DONE (AdminPermissionList* types)
3. `admin/roles` — AdminRoleItem, AdminRoleListResponse
4. `admin/languages` — AdminLanguageItem, AdminLanguageListResponse

### Phase 3 — User-management (hypothetical new features)
5. `user-management/user-preferences` — UserPreferencesData, notification/locale settings response types
6. `user-management/api-keys` — ApiKeyListItem, ApiKeyListResponse, CreateApiKeyResponse

### Phase 4 — Common reference data
7. `common/countries` — CountryListItem, CountryListResponse
8. `common/states` — StateListItem, StateListResponse
9. `common/cities` — CityListItem, CityListResponse
10. `common/search-location` — SearchLocationResponse
11. `common/activity-logs` — ActivityLogListItem, ActivityLogListResponse

### Phase 5 — UI component type files
12. `packages/ui/src/components/user/preferences/types/` — user preference display types
13. `packages/ui/src/components/common/` — SearchParams, shared UI types

### Phase 6 — Delete packages/types
14. Confirm zero imports of `@repo/types` across all apps and packages
15. Delete `packages/types/src/`
16. Remove `@repo/types` from all `package.json` dependencies
17. Run full build: `pnpm run build`

---

# Part 9 — What Stays Local (Do Not Migrate)

These types must NOT go into the package:

| Type | Reason | Correct location |
|---|---|---|
| Sort field union types (`'category' \| 'source' \| ...`) | UI-only interaction state | Local `_types` file |
| Local filter state types | UI-only | Local component or `_types` file |
| Component event handler types | React-specific | Component file |
| Button variants, design token types | Purely presentational | `packages/ui` |
| Backend domain join shapes (`RolePermissionResult`, etc.) | Not an API contract | `apps/backend/src/domain/<domain>.types.ts` |
| Zod schema types for internal backend validation (not shared) | Not a shared contract | Backend `validations/` folder |
| Test fixture types | Test-only | Test file or test utils |

---

# Part 10 — Import Reference

After migration, every consumer uses exactly one of these import paths:

```ts
// DB entity types
import type { AppPermissions } from "@repo/schemas-types/tables/entity-types";

// Common primitives
import type { Pagination, LabeledCount, SupportingDocument } from "@repo/schemas-types/payload-schemas/common/payload.schema";

// Admin feature types
import type { AdminPermissionListResponse } from "@repo/schemas-types/payload-schemas/admin/permissions/payload.schema";

// User-management feature types
import type { UserPreferencesData } from "@repo/schemas-types/payload-schemas/user-management/user-preferences/payload.schema";
import type { ApiKeyListItem } from "@repo/schemas-types/payload-schemas/user-management/api-keys/payload.schema";

// Auth types
import type { AuthUserInfo, AuthSessionData } from "@repo/schemas-types/payload-schemas/auth/payload.schema";
```

Never import from:
- `@repo/types` (deprecated)
- `apps/backend/src/...` (from frontend/admin)
- `packages/ui/components/.../types/` (types belong in validations-updated)
- Another app's `_types` folder

---

# Part 11 — Validation Gate (After Every Module)

Do not proceed to the next module until all of these pass:

```bash
# 1. Package builds
pnpm --filter "@repo/schemas-types" build

# 2. Backend builds (TypeScript type safety gate)
pnpm --filter backend build

# 3. Admin type-checks
pnpm --filter admin run check-types

# 4. Frontend type-checks  
pnpm --filter frontend run check-types

# 5. UI package type-checks
pnpm --filter "@repo/ui" run check-types
```

If any command fails, fix the errors before declaring the module complete. Do not suppress TypeScript errors with `@ts-ignore` or `as unknown as`.

---

# Part 12 — Rules Summary

```
MUST:
□ All cross-app types live in packages/schemas-types.
□ All types are inferred from Zod schemas (no hand-written interfaces for API shapes).
□ API response schemas live in payload-schemas/<domain>/<feature>/payload.schema.ts.
□ Common primitives (Pagination, LabeledCount, SupportingDocument) from payload-schemas/common/.
□ DB entity types from tables/entity-types.ts.
□ Backend services declare return types using the centralized response type.
□ Admin/frontend _types files are re-export alias modules only — no shape definitions.
□ Label lookups coalesce to null (... ?? null), never leave undefined in the response.
□ packages/schemas-types build must pass before any consuming app is changed.
□ All 5 validation commands pass before a module is marked complete.

MUST NOT:
□ Do not import from @repo/types (deprecated — delete on sight, replace import).
□ Do not declare local response types in .service.ts files.
□ Do not declare shape interfaces in admin/frontend _types files.
□ Do not define data-shape types in packages/ui/components/.../types/.
□ Do not inline pagination / LabeledCount / SupportingDocument shapes anywhere.
□ Do not hand-write TypeScript interfaces for shapes that cross app boundaries.
□ Do not redeclare status enums that already exist in @repo/constants.
□ Do not duplicate a shape that already exists in the package.
□ Do not use @ts-ignore or as unknown as to suppress migration-related type errors.
□ Do not migrate multiple modules simultaneously — one module at a time, gate on build.
```
