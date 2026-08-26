---
name: frontend-contracts
description: Layer L0 — shared contracts for apps/frontend. Use when adding or changing a Zod payload schema, a response type, an entity type, or a shared constant, and when deciding what belongs in types/domain.ts or validations/schemas.ts versus @repo/schemas-types. Covers the value/type distinction, canonical naming, and the no-re-export rule.
---

# L0 — Contracts (`@repo/schemas-types`, `@repo/constants`)

Every type and every validation rule the frontend shares with the backend lives in `packages/schemas-types`. This is the first thing built and the last thing duplicated.

**Contracts are built before any module code.** After changing them:

```bash
pnpm --filter @repo/schemas-types build   # must pass before touching apps
```

## Package layout

```
packages/schemas-types/src/
├── tables/            Drizzle-derived entity types (App* — AppUsers, AppRoles, ...)
│   └── entity-types.ts    central re-export hub
├── constants/         pure runtime values (pagination limits, timezone offsets, status sets)
└── payload-schemas/<domain>/<feature>/
    ├── payload.schema.ts     Zod request schemas (VALUES) + inferred request TYPES
    └── response.schema.ts    plain TypeScript response interfaces
```

`payload-schemas/common/api-types.schema.ts` holds the canonical `ApiResponse<T>` — a discriminated union. Import it from there, never from a shim or a local copy.

Cross-stack runtime enums and option arrays go in `packages/constants/src/<domain>/`.

## The value / type distinction

A Zod schema has two faces, and mixing them up fails at runtime, not at build:

| Face | What it is | Used for | Import style |
|---|---|---|---|
| Schema **VALUE** | a `z.ZodObject` runtime object | `zodResolver(Schema)`, `Schema.parse(data)`, `Schema.safeParse(data)` | plain `import` |
| Inferred **TYPE** | `z.infer<typeof Schema>`, erased at compile time | parameter types, props, `useForm<T>` generic | `import type` |

`import type` on a schema you then pass to `zodResolver` compiles cleanly and throws at runtime. Check this whenever a form "works in the editor" but blows up on mount.

## Naming — no abbreviation

| Artifact | Pattern | Example |
|---|---|---|
| Zod schema VALUE | `<Domain><Feature>PayloadValidationSchema` | `UserUpdateNamePayloadValidationSchema` |
| Inferred request TYPE | `<Domain><Feature>PayloadType` | `UserUpdateNamePayloadType` |
| Response interface | `<Domain><Feature>ResponseType` or `<Feature>ApiResponse` | `UserProfileResponseType` |
| List/paginated response | `<Domain><Feature>ListResponse` | `UserInvitationListResponse` |

The verbosity is deliberate — these names appear at import sites across three apps and must be unambiguous.

## `payload.schema.ts` anatomy

```typescript
import z from 'zod';
import sanitizeHtml from 'sanitize-html';

// ─── Zod request schemas (VALUES) ───────────────────────────────────────────
export const UserUpdateNamePayloadValidationSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(255, { message: 'Name cannot exceed 255 characters' })
    .trim()
    .transform(val => sanitizeHtml(val)),
});

// ─── Inferred TypeScript types ──────────────────────────────────────────────
export type UserUpdateNamePayloadType = z.infer<typeof UserUpdateNamePayloadValidationSchema>;

// ─── Response types — plain interfaces, no Zod ───────────────────────────────
export interface UserProfileHeaderData {
  id: string;
  name: string;
  avatarUrl: string | null;
  profileUrl: string | null;
}
```

- `export const`, never `export default`.
- Schema VALUE and its inferred TYPE co-located in the same file.
- Response types are plain interfaces — Zod only where something is validated on intake.
- `sanitizeHtml` belongs inside the `.transform()` pipeline, not in a service.
- Error messages live in the schema, so backend, frontend, and admin all surface identical copy.

## Import at the call site — canonical name, no alias

```typescript
// value — for zodResolver / .parse()
import { UserUpdateNamePayloadValidationSchema } from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';

// type — for signatures and props
import type { UserUpdateNamePayloadType } from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';
```

`import { X as Y }` is forbidden: it creates two names for one thing, breaks grep, and hides the canonical name.

## The two module-local files — what they are NOT

Both of these are for **local** code only. Re-exporting a package schema or type through them is an explicit anti-pattern: it adds an indirection layer and lets the local alias drift from the contract.

### `types/domain.ts` — local types and composite DTOs only

```typescript
// For Next.js-local types and composite DTOs ONLY.
// Never re-export from @repo/schemas-types here.

import type {
  ProfileHeaderDataType,
  TimezoneEntryType,
} from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';

// A composite DTO — defined here only because no package type is a direct fit
export interface TransformedProfileData {
  header: ProfileHeaderDataType;
  timezones: TimezoneEntryType[];
}

// Hook option / result types
export interface UrlValidationOptions { id: string; debounceMs?: number }
export interface UrlValidationState {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | null;
}
```

### `validations/schemas.ts` — UI-only constants and local Zod only

```typescript
// For UI-only constants and local Zod schemas ONLY.
// Never re-export schemas from @repo/schemas-types here.

export const UI_LIMITS = { MAX_FILE_SIZE: 5 * 1024 * 1024 };

// A purely UI-side schema with no backend equivalent
// export const localFilterSchema = z.object({ search: z.string().optional() });
```

A module has **no** `validations/` folder at all when the backend owns every validation rule — `modules/user-management/users/` sends raw email input and renders the 422 `details` categories back.

## `ApiResponse<T>` is a discriminated union

```typescript
import type { ApiResponse } from '@repo/schemas-types/payload-schemas/common/api-types.schema';

if (!response.success) throw createApiError(response.message, 500);
response.data.field;   // narrowed — safe
```

`response.data?.field` without narrowing masks a real type error. Never define a bespoke `{ success: boolean; data?: T; message: string }`.

## Change order

1. Edit `payload.schema.ts` / `response.schema.ts` in `packages/schemas-types`.
2. `pnpm --filter @repo/schemas-types build` — must pass.
3. Add cross-stack runtime enums to `packages/constants/src/<domain>/` if the backend needs them too.
4. Only then update `api/` → `services/` → `handlers/` → components.
5. `pnpm --filter frontend check-types` to surface every consumer the change broke.

A schema change is a cross-app contract change. Check `apps/backend` and `apps/admin` consumers before merging.

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Type redefined locally when it exists in `@repo/schemas-types` | Import it directly |
| `types/domain.ts` re-exports package types | Import at the call site |
| `validations/schemas.ts` re-exports package schemas | Import the value at the call site |
| `import { X as Y }` from `@repo/schemas-types` | Canonical name |
| `import type` on a schema passed to `zodResolver` | Plain `import` for values |
| Bespoke `{ success, data?, message }` response type | `ApiResponse<T>` |
| Zod schema defined inline in a component | Add it to `payload.schema.ts` |
| `sanitizeHtml` called in a service | Put it in the schema's `.transform()` |
| Editing schemas without rebuilding the package | `pnpm --filter @repo/schemas-types build` |

## Checklist

- [ ] Schema and inferred type co-located in `payload.schema.ts`
- [ ] Canonical `<Domain><Feature>PayloadValidationSchema` / `PayloadType` names
- [ ] Response types are plain interfaces in `response.schema.ts`
- [ ] `pnpm --filter @repo/schemas-types build` passes
- [ ] Consumers import directly, canonical name, no alias
- [ ] Values imported with `import`, types with `import type`
- [ ] `types/domain.ts` and `validations/schemas.ts` contain only local code
- [ ] `pnpm --filter frontend check-types` passes across every consumer
