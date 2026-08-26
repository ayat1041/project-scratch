---
name: admin-services
description: Layer A5 — services in apps/admin modules. Use when adding an SSR read for a Presenter, a wire-to-domain transformer, searchParams normalization, or a mutation orchestration. Covers the searchParams contract and the status-mapping pattern admin uses.
---

# A5 — Services

The service layer is where admin does most of its real work: it normalizes `searchParams`, calls the API, and maps wire DTOs into the domain shapes the table components render.

Called by the **Presenter** (SSR reads) and by **handlers** (mutations). Standalone `export async function` declarations — no class.

File: `<domain>-service.ts` — `roles-service.ts`.

## SSR read — the Presenter's entry point

The service takes the raw `searchParams` Promise and returns a fully-shaped result. This is why the Presenter stays a thin Server Component.

```typescript
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function getAllRoles(searchParams: SearchParams) {
  const params = await searchParams;
  const response = await api.listAllRoles({
    search: first(params.search) ?? '',
    sortBy: first(params.sortBy) ?? 'name',
    limit: Number.parseInt(first(params.limit) ?? '10', 10),
    offset: Number.parseInt(first(params.offset) ?? '0', 10),
  });

  return {
    roles: response.data.roles.map(_fromApiRole),   // wire → domain
    counts, totalItems, totalPages, limit, offset,
  };
}
```

Every `searchParams` value is `string | string[] | undefined`. Normalize through one `first()` helper — never index `[0]` inline at five call sites.

The service returns exactly what the Presenter destructures: rows, counts, and pagination. Shaping that here is what keeps the Presenter free of logic.

## What the Presenter destructures

The service returns exactly the shape the Presenter reads — same envelope as
`apps/frontend`:

```typescript
const data = await getAllRoles(searchParams);
const pagination = data.pagination;   // { limit, offset, totalItems, totalPages }
const rows       = data.data;
const counts     = data.counts;       // LabeledCount[] per filter dimension
```

`counts` feeds `(filter)/index.tsx`, which builds its `FilterField[]` options straight from
those arrays — `label` is the API's, never a client-side copy. Shaping this here is what
keeps the Presenter free of logic.

## Wire → domain transformation

Admin renders backend records with more fields than the UI needs, so the wire shapes are wide and the display shapes are narrow. Private transformers convert them:

```typescript
// ---- Private transformers ----
function _fromApiPermission(apiPermission: AdminApiPermission, roleId: string): Permission { }
function _fromApiRole(apiRole: AdminApiRole): RoleWithPermissions { }
```

- Prefix module-private transformers with `_` and group them under a comment banner, as in the example above.
- Domain types live in `types/domain.ts`; wire types are imported from `@repo/schemas-types` under their canonical names.
- Category mapping (backend value → admin display value) belongs in `constants/<module>.constants.ts` as a shared map — e.g. `normalizePermissionCategory` — not inline in a transformer and not duplicated in a component.

Components must never see a raw wire shape.

## Mutations

```typescript
export async function updateRole(roleId: string, payload: AdminUpdateRolePayloadType) {
  const validated = AdminUpdateRolePayloadValidationSchema.parse(payload);
  return api.updateRole(roleId, validated);
}
```

If the backend owns every validation rule, forward the payload and let the API surface the 422 — do not mirror a backend schema locally.

When wrapping Zod, re-throw non-Zod errors **unchanged**. Wrapping them in `new Error(message)` strips `.status`/`.statusCode`, and `handleErrorToast` can no longer format a 422 as a field list.

## `ApiResponse<T>` narrowing

```typescript
if (!response.success) throw createApiError(response.message, 500);
response.data.roles;   // narrowed — safe
```

`ApiResponse<T>` is a discriminated union. `response.data?.field` without narrowing masks a real type error.

## Allowed imports

```
✅  ../api/* (namespace import)
✅  @repo/schemas-types    types AND schema values, canonical names
✅  @repo/constants
✅  @repo/utilities/error-handling
✅  ../types/domain, ../constants/, ../utils/

❌  sonner                          toast is the handler's job
❌  react, any hook, any component  upward dependency
❌  raw fetch to the backend        use api/
```

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| `searchParams` normalized ad hoc at each call site | One `first()` helper |
| Raw wire DTO returned to a component | Transform to the domain type here |
| Status mapping duplicated in a component | Shared map in `constants/` |
| Service imports `sonner` or React | Handler / component layer |
| `response.data?.field` without narrowing | `if (response.success)` first |
| Non-Zod errors re-wrapped in `new Error()` | Re-throw unchanged |
| Presenter given a shape it has to re-derive | Return exactly what it destructures |
| Type redefined locally when it exists in `@repo/schemas-types` | Import it directly |

## Checklist

- [ ] File named `<domain>-service.ts`; standalone exported async functions
- [ ] SSR read accepts the `searchParams` Promise and normalizes via one helper
- [ ] Returns exactly the shape the Presenter destructures
- [ ] Wire → domain transformers are `_`-prefixed and private
- [ ] Status maps live in `constants/`
- [ ] `ApiResponse<T>` narrowed before `.data`
- [ ] Non-Zod errors re-thrown unchanged
- [ ] No `sonner`, no React, no raw `fetch`
- [ ] `pnpm --filter admin check-types` passes
