---
description: Add an endpoint URL builder and its HTTP function to a frontend module's api/ layer (L7).
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend API Function (L7)

## Step 1 — Gather inputs

- Target module: `modules/<domain>/<feature>/`
- HTTP method and backend path (with param placeholders)
- Request payload type name from `@repo/schemas-types` (or "none")
- Response data shape — the `T` in `ApiResponse<T>`; `null` for mutations with no payload
- Server-rendered read, or client call?

If the payload/response types do not exist yet, stop and run `/frontend-contract` first.

## Step 2 — Required reading

- Skill `frontend-api-layer`
- The module's existing `api/<feature>-api.ts`, to match its local helper style

## Step 3 — Add the endpoint builder

In `api/api-constants.ts`, add to the existing `<DOMAIN>_<FEATURE>_ENDPOINTS` object:

```typescript
UPDATE_NAME: (id: string) => `/user-management/v1/api-keys/${id}/name`,
```

**Path only.** `fetchWithCookies` and `fetchWithCookiesServer` prefix `NEXT_PUBLIC_API_URL` themselves. A builder is always a function, even with no params. No logic, no query-string assembly, `as const` on the object.

## Step 4 — Add the HTTP function

```typescript
export async function updateName(
  id: string,
  data: UserManagementUpdateNamePayloadType
): Promise<ApiResponse<null>> {
  const response = await fetchWithCookies(E.UPDATE_NAME(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = (await response.json()) as ApiResponse<null>;
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Request failed', response.status);
  }
  return result;
}
```

Non-negotiable:

- Returns `Promise<ApiResponse<T>>` — `ApiResponse` imported from `@repo/schemas-types/payload-schemas/common/api-types.schema`
- Checks **both** `!response.ok` **and** `!result.success` (the backend can return 200 with `success: false`)
- Throws `createApiError` from `@repo/utilities/error-handling` — never a local `createErrorWithStatus`
- `fetchWithCookies` for client calls; `fetchWithCookiesServer` for SSR reads
- If the module already has `postJSON` / `patchJSON` / `deleteJSON` helpers, use them and keep the new export a one-liner
- No validation, no transformation, no toast, no import from `../services`, `../handlers`, `../hooks`, or `../components`

Query strings: `URLSearchParams`, appending only params that are present.

## Step 5 — Verify

```bash
pnpm --filter frontend lint
pnpm --filter frontend check-types
```

## Step 6 — Report

- Endpoint key added and its path.
- Function signature and return type.
- Next: `/frontend-service`.
