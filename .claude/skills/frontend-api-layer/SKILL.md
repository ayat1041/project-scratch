---
name: frontend-api-layer
description: Layer L7 — the HTTP transport layer in modules/<domain>/<feature>/api. Use when adding an endpoint URL builder in api-constants.ts or an HTTP function in <domain>-api.ts. Covers ApiResponse, createApiError, fetchWithCookies vs fetchWithCookiesServer, CSRF, and the no-logic rule.
---

# L7 — API Transport (`api/`)

Two files, one job: turn a call into an HTTP request and a typed response. **No business logic, no transformation, no toast, no React.**

```
api/
├── api-constants.ts       endpoint URL builders — pure string construction
└── <domain>-api.ts        one exported async function per HTTP call
```

## `api-constants.ts`

Endpoint builders return **path-only** strings. `fetchWithCookies` and `fetchWithCookiesServer` both prefix `NEXT_PUBLIC_API_URL` themselves — do not prefix it again here.

```typescript
export const API_KEY_ENDPOINTS = {
  CREATE: (userId: string) => `/user-management/v1/api-keys/${userId}`,
  EDIT: (apiKeyId: string) => `/user-management/v1/api-keys/${apiKeyId}`,
  ROTATE: (apiKeyId: string) => `/user-management/v1/api-keys/${apiKeyId}/rotate`,
  SAVE_LABEL: (apiKeyId: string) => `/user-management/v1/api-keys/${apiKeyId}/label`,
  DELETE: () => `/user-management/v1/api-keys`,
  REVOKE_ALL: () => `/user-management/v1/api-keys/revoke-all`,
} as const;
```

Rules: `SCREAMING_SNAKE_CASE` keys, `<DOMAIN>_<FEATURE>_ENDPOINTS` object name, `as const`, always a function (even with no params, as `DELETE` above), no logic, no conditionals, no query-string assembly. Query strings are built in the API function or the service.

## `<domain>-api.ts`

Every function returns `Promise<ApiResponse<T>>` and throws `createApiError` on failure.

```typescript
import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';
import { createApiError } from '@repo/utilities/errors/error-parsing';
import type { ApiResponse } from '@repo/schemas-types/payload-schemas/common/api-types.schema';
import { API_KEY_ENDPOINTS as E } from './api-constants';

export async function updateName(
  id: string,
  data: UpdateNamePayloadType
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

### Non-negotiables

- **Check both** `!response.ok` **and** `!result.success` before throwing. The backend can return HTTP 200 with `success: false`.
- `createApiError(message, status)` from `@repo/utilities/errors/error-parsing` — it does `Object.assign(new Error(message), { status, statusCode: status })`, which is what lets `handleErrorToast` format a 422. Never write a local `createErrorWithStatus`.
- `ApiResponse<null>` for mutations with no payload; `ApiResponse<T>` with the data shape for reads. Never a bespoke `{ success: boolean; data?: T }` type — that breaks discriminated-union narrowing downstream.
- Import `ApiResponse` from `@repo/schemas-types/payload-schemas/common/api-types.schema`.

### Shared verb helpers

When a module has many same-shaped calls, define local `postJSON` / `patchJSON` / `deleteJSON` helpers at the top of the file (as `modules/user-management/api-keys/api/api-keys-api.ts` does) and keep each exported function a thin call:

```typescript
async function postJSON(url: string, body: unknown): Promise<ApiResponse<null>> {
  const response = await fetchWithCookies(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as ApiResponse<null>;
  if (!response.ok || !data.success) throw createApiError(data.message || 'Request failed', response.status);
  return data;
}

export const createApiKey = (userId: string, payload: MutationData) =>
  postJSON(E.CREATE(userId), payload);
```

## Which fetch helper

| Helper | Import from | Use in | Notes |
|---|---|---|---|
| `fetchWithCookies` | `@repo/utilities/http/fetch-with-cookies` | `api/` — client reads and mutations | `credentials: 'include'`, auto CSRF header on non-GET/HEAD/OPTIONS |
| `api.get/post/put/patch/delete` | `@repo/utilities/http/fetch-with-cookies` | `api/` — convenience wrappers over the above | Sets `Content-Type` and serializes the body for you |
| `fetchWithCookiesServer` | `@repo/utilities/http/fetch-with-cookies-server` | `api/` or a parent `private/services/` — SSR reads | Reads cookies via `next/headers`; safe only on the server |

CSRF and session rotation are handled inside these helpers. Never call bare `fetch` against the backend, never set the CSRF header by hand, never build an `Authorization` header.

## Query strings

```typescript
const queryParams = new URLSearchParams();
if (status) queryParams.append('status', status);
if (search) queryParams.append('search', search);
const queryString = queryParams.toString();
const url = `${E.LIST(userId)}${queryString ? `?${queryString}` : ''}`;
```

Append only present values. Never send an empty param.

## Allowed imports

```
✅  ./api-constants
✅  @repo/utilities/http/fetch-with-cookies, http/fetch-with-cookies-server, errors/error-parsing
✅  @repo/schemas-types                types only, canonical names
✅  @repo/constants

❌  ../services, ../handlers, ../components, ../hooks    upward dependency
❌  sonner
❌  zod / any validation                                 that is the service's job
❌  process.env.NEXT_PUBLIC_API_URL in a URL builder     the fetch helper prefixes it
```

## Anti-patterns

| Anti-pattern | Why it breaks | Correct |
|---|---|---|
| Local `createErrorWithStatus` helper | Duplicates `@repo/utilities/errors/error-parsing` | `createApiError` |
| Custom `{ success, data?, message }` type | Calling code can't narrow safely | `ApiResponse<T>` from `@repo/schemas-types` |
| Only checking `!response.ok` | Misses HTTP 200 with `success: false` | Check both |
| Transformation or mapping in `api/` | Belongs to the service | Return the wire shape untouched |
| Bare `fetch` to the backend | No cookies, no CSRF, no rotation | Use the fetch helpers |
| `NEXT_PUBLIC_API_URL` prefixed in `api-constants.ts` | Double-prefixed URL | Path only |
| `fetchWithCookiesServer` in a client-reachable path | `next/headers` is server-only | `fetchWithCookies` |

## Checklist

- [ ] `api-constants.ts` returns path-only strings, `as const`, no logic
- [ ] One exported async function per HTTP call in `<domain>-api.ts`
- [ ] Returns `Promise<ApiResponse<T>>`
- [ ] Throws `createApiError(result.message || 'Request failed', response.status)`
- [ ] Checks `!response.ok || !result.success`
- [ ] Correct fetch helper for server vs. client
- [ ] Query params appended only when present
- [ ] No validation, no transformation, no toast, no upward imports
