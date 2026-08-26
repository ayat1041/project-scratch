---
description: Add a service function to an admin module's services/ layer (A5) — an SSR read for a Presenter, a wire-to-domain transformer, or a mutation.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Admin Service Function (A5)

## Step 1 — Gather inputs

- Target module and the `api/` function(s) to call
- SSR read (called by a Presenter) or mutation (called by a handler)?
- For a read: exactly what the Presenter will destructure
- Wire→domain transformation needed? Status mapping?
- Does the frontend validate, or does the backend own every rule?

## Step 2 — Required reading

- Skill `admin-services`
- The module's existing `services/<module>-service.ts`
- `modules/user-management/roles/services/roles-service.ts` as the reference

## Step 3a — SSR read

Takes the raw `searchParams` Promise, returns the fully-shaped result:

```typescript
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function getRoles(searchParams: SearchParams) {
  const params = await searchParams;
  const response = await api.listAllRoles({
    search: first(params.search) ?? '',
    status: first(params.status) ?? 'all',
    limit: Number.parseInt(first(params.limit) ?? '10', 10),
    offset: Number.parseInt(first(params.offset) ?? '0', 10),
  });

  if (!response.success) throw createApiError(response.message, 500);

  return {
    roles: response.data.roles.map(_fromApiRole),
    statusCounts, totalItems, totalPages, limit, offset,
  };
}
```

- Normalize every `searchParams` value through **one** `first()` helper — never index `[0]` inline at each call site.
- Return exactly what the Presenter destructures. Shaping it here is what keeps the Presenter logic-free.
- Narrow `ApiResponse<T>` with `if (response.success)` before reading `.data`.
- **Do not swallow a failure into an empty result** — an admin cannot distinguish "no records" from "the API is down", and will act on the wrong conclusion.

## Step 3b — Transformers

```typescript
// ---- Private transformers ----
function _fromApiRole(apiRole: AdminApiRole): RoleWithPermissions { }
```

`_`-prefixed, grouped under the banner comment. Domain types in `types/domain.ts`; wire types imported from `@repo/schemas-types` under canonical names. Status mapping (backend value → admin display) lives in `constants/<module>.constants.ts` as a shared map — never inline, never duplicated in a component.

## Step 3c — Mutation

```typescript
export async function deactivateRole(roleId: string, payload: DeactivateRolePayloadType) {
  const validated = AdminDeactivateRolePayloadValidationSchema.parse(payload);
  return api.deactivateRole(roleId, validated);
}
```

If the backend owns validation, forward the payload and let the API surface the 422 — do not mirror a backend schema locally. When wrapping Zod, re-throw non-Zod errors **unchanged**; wrapping strips `.status` and breaks 422 rendering.

## Step 4 — Constraints

- No `sonner`, no React, no hooks, no components
- No raw `fetch` — go through `api/`
- Schemas and types imported from `@repo/schemas-types` under canonical names, no alias
- Components never see a raw wire shape

## Step 5 — Verify

```bash
pnpm --filter admin lint
pnpm --filter admin check-types
```

## Step 6 — Report

- Function signature and what it normalizes / transforms / validates.
- The exact shape a Presenter can destructure.
- Next: `/admin-handler` for a mutation, `/admin-component` for a read.
