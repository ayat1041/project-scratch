---
description: Add an endpoint URL builder and its HTTP function to an admin module's api/ layer (A6).
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Admin API Function (A6)

## Step 1 — Gather inputs

- Target module: `modules/<domain>/<module>/`
- HTTP method and backend path
- Request payload type from `@repo/schemas-types` (or "none")
- Response type name from `@repo/schemas-types`
- **Who calls it** — a Presenter (SSR read) or a handler (client mutation)? This picks the fetch helper

If the payload/response types do not exist, stop and run `/frontend-contract` first.

## Step 2 — Required reading

- Skill `admin-api-layer`
- The module's existing `api/<module>-api.ts`

## Step 3 — Add the endpoint builder

```typescript
DEACTIVATE: (roleId: string) => `/admin/v1/roles/${roleId}/deactivate`,
```

**Path only** — both fetch helpers prefix `NEXT_PUBLIC_API_URL`. Always a function, even with no params. `as const` on the object. No logic, no query-string assembly.

## Step 4 — Add the HTTP function

```typescript
export async function deactivateRole(
  roleId: string,
  payload: AdminDeactivateRolePayloadType
): Promise<AdminDeactivateRoleResponseType> {
  const response = await fetchWithCookies(ROLES_API.DEACTIVATE(roleId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw createApiError(data.message || 'Failed to deactivate role', response.status);
  }
  return data;
}
```

Non-negotiable:

- Check **both** `!response.ok` **and** `!data.success`
- `createApiError` from `@repo/utilities/error-handling` — **never** a local `createErrorWithStatus` (the admin instructions still name it; it exists nowhere in the app)
- Canonical response type from `@repo/schemas-types` — no bespoke `{ success, data?, message }`
- Fallback message specific to this call, not a generic `'Request failed'`
- No validation, no transformation, no toast, no import from `../services`/`../handlers`/`../components`

## Step 5 — Pick the fetch helper

| Caller | Helper |
|---|---|
| Presenter (SSR read) | `fetchWithCookiesServer` — reads cookies via `next/headers`, server-only |
| Handler (client mutation) | `fetchWithCookies` — `credentials: 'include'`, auto CSRF |

A module's `api/` file commonly imports both. Choosing the server helper for a client-reached function throws at runtime.

## Step 6 — Query strings

```typescript
const queryParams = new URLSearchParams();
if (status && status !== 'all') queryParams.append('status', statusToBackendMap[status] ?? status);
if (search) queryParams.append('search', search);
```

Append only present values. Admin-display → backend value mapping goes in a named map beside the function, not inline conditionals.

## Step 7 — Verify

```bash
pnpm --filter admin lint
pnpm --filter admin check-types
```

## Step 8 — Report

- Endpoint key and path.
- Function signature, response type, and which fetch helper, with the caller that justifies it.
- Next: `/admin-service`.
