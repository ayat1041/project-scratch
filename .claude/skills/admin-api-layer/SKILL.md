---
name: admin-api-layer
description: Layer A6 — the HTTP transport layer in apps/admin modules. Use when adding an endpoint URL builder in api-constants.ts or an HTTP function in <domain>-api.ts. Covers createApiError, ApiResponse, and choosing fetchWithCookies versus fetchWithCookiesServer for admin's SSR reads.
---

# A6 — API Transport (`api/`)

Two files, one job: turn a call into an HTTP request and a typed response. **No business logic, no transformation, no toast.**

```
api/
├── api-constants.ts     endpoint URL builders — pure string construction
└── <domain>-api.ts      one exported async function per HTTP call
```

## `api-constants.ts`

Builders return **path-only** strings. Both fetch helpers prefix `NEXT_PUBLIC_API_URL` themselves — do not prefix it here.

```typescript
export const ROLES_API = {
  LIST: () => `/admin/v1/roles`,
  UPDATE: (roleId: string) => `/admin/v1/roles/${roleId}`,
  DELETE: (roleId: string) => `/admin/v1/roles/${roleId}`,
} as const;
```

`SCREAMING_SNAKE_CASE` object name, `as const`, always a function even with no params, no logic, no query-string assembly.

## `<domain>-api.ts`

```typescript
import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';
import { fetchWithCookiesServer } from '@repo/utilities/http/fetch-with-cookies-server';
import { createApiError } from '@repo/utilities/errors/error-parsing';
import { ROLES_API } from './api-constants';

export async function deleteRole(roleId: string): Promise<AdminDeleteRoleResponseType> {
  const response = await fetchWithCookies(ROLES_API.DELETE(roleId), {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw createApiError(data.message || 'Failed to delete role', response.status);
  }
  return data;
}
```

### Non-negotiables

- Check **both** `!response.ok` **and** `!data.success` — the backend can return HTTP 200 with `success: false`.
- `createApiError(message, status)` from `@repo/utilities/errors/error-parsing`. It does `Object.assign(new Error(message), { status, statusCode: status })`, which is what lets `handleErrorToast` format a 422 as a field list. **Never write a local `createErrorWithStatus`** — the admin instructions still name it, but it exists nowhere in `apps/admin`.
- Response types come from `@repo/schemas-types` under their canonical names. Never a bespoke `{ success, data?, message }` — that breaks discriminated-union narrowing in the service.
- Fallback messages are specific per call (`'Failed to delete role'`, not `'Request failed'`) — this is the string an admin sees when the server sends none.

## Which fetch helper

| Helper | Use for | Notes |
|---|---|---|
| `fetchWithCookiesServer` | The **SSR read** a Presenter triggers | Reads cookies via `next/headers` — server-only |
| `fetchWithCookies` | Client-side mutations (create, update, delete) | `credentials: 'include'`, auto CSRF on non-GET |

Admin's reads are server-rendered, so a module's `api/` file commonly imports **both** — `roles-api.ts` does. Pick per function, by who calls it: a function reached from a Presenter uses the server helper; one reached from a handler uses the client helper. Calling `fetchWithCookiesServer` from a client path throws, because `next/headers` does not exist there.

## Query strings

```typescript
const queryParams = new URLSearchParams();
if (search) queryParams.append('search', search);
if (sortBy) queryParams.append('sortBy', sortBy);
const url = `${ROLES_API.LIST()}${queryParams.toString() ? `?${queryParams}` : ''}`;
```

Append only present values. Where admin display values differ from backend values, the mapping lives in a named map (`categoryToBackendMap`) beside the function — not scattered through conditionals.

## Allowed imports

```
✅  ./api-constants
✅  @repo/utilities/http/fetch-with-cookies, http/fetch-with-cookies-server, errors/error-parsing
✅  @repo/schemas-types   types only, canonical names
✅  @repo/constants
✅  ../types/domain       for local param types (e.g. RoleQueryParams)

❌  ../services, ../handlers, ../components, ../hooks   upward dependency
❌  sonner
❌  zod / any validation                                the service's job
❌  process.env.NEXT_PUBLIC_API_URL in a URL builder    the helper prefixes it
```

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Local `createErrorWithStatus` | `createApiError` from `@repo/utilities/errors/error-parsing` |
| Only checking `!response.ok` | Check `!data.success` too |
| Bespoke `{ success, data?, message }` type | Canonical response type from `@repo/schemas-types` |
| Transformation or status mapping to display values in `api/` | Service layer |
| `fetchWithCookiesServer` on a client path | `fetchWithCookies` |
| Generic `'Request failed'` fallback everywhere | Specific per call |
| `NEXT_PUBLIC_API_URL` in `api-constants.ts` | Path only |
| Bare `fetch` to the backend | Use the helpers — cookies, CSRF, rotation |

## Checklist

- [ ] `api-constants.ts` returns path-only strings, `as const`, no logic
- [ ] One exported async function per HTTP call
- [ ] Returns the canonical response type from `@repo/schemas-types`
- [ ] Throws `createApiError(message, status)` with a specific fallback
- [ ] Checks `!response.ok || !data.success`
- [ ] Correct fetch helper for server vs. client caller
- [ ] Query params appended only when present
- [ ] No validation, no transformation, no toast, no upward imports
