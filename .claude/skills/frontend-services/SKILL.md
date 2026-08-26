---
name: frontend-services
description: Layer L6 — services in modules/<domain>/<feature>/services. Use when adding business logic, Zod validation, wire-to-domain mapping, query-string building, SSR reads, or multi-step orchestration. Covers wrapZodError, fetchWithCookiesServer for SSR, and the no-toast/no-React rule.
---

# L6 — Services (`services/`)

The service layer holds the module's business logic: validate input, transform responses, orchestrate multi-step operations. It is called by handlers (mutations), hooks (client reads), and `page.tsx` (SSR reads).

Standalone `export async function` declarations — no class, no `this`. **No `toast`, no React, no direct `fetch` to a backend endpoint.**

File: `<feature>-service.ts` — `api-keys-service.ts`, `user-invitations-service.ts`, `<domain>-profile-service.ts`. Add `services/index.ts` as a barrel only when the module has more than one service file.

## Mutation — validate, then delegate

```typescript
import { ZodError } from 'zod';
import * as api from '../api/user-api';
import { UserUpdateNamePayloadValidationSchema } from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';

function wrapZodError(error: unknown): never {
  if (error instanceof ZodError)
    throw new Error(error.issues[0]?.message ?? 'Validation failed');
  throw error; // re-throw unchanged — preserves .status / .statusCode
}

export async function updateName(id: string, payload: UpdateNamePayloadType) {
  try {
    const data = UserUpdateNamePayloadValidationSchema.parse(payload);
    return api.updateName(id, data);
  } catch (error) {
    wrapZodError(error);
  }
}
```

**The `wrapZodError` rule that matters:** non-Zod errors are re-thrown **unchanged**. Wrapping them in `new Error(message)` strips `.status` / `.statusCode`, and `handleErrorToast` can then no longer format a 422 correctly.

When the backend owns every validation rule, the service does not pre-validate at all — it forwards the payload and lets the API surface the 422. `modules/user-management/users/` does exactly this and has no `validations/` folder as a result.

## SSR read — `fetchWithCookiesServer`

A Server Component page calls the service; the service reaches the backend with forwarded cookies.

```typescript
import { fetchWithCookiesServer } from '@repo/utilities/http/fetch-with-cookies-server';
import { getCurrentUser } from '@/shared/services/session-service';
import type { SearchParams } from '@/shared/types/search-params';

export async function getAllApiKeys(
  searchParams: SearchParams
): Promise<UserGetAllApiKeysApiResponse> {
  const [{ search, scope, status, limit, offset }, { id }] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);

  const queryParams = new URLSearchParams();
  if (scope) queryParams.append('scope', Array.isArray(scope) ? scope[0] : scope);
  if (search) queryParams.append('search', Array.isArray(search) ? search[0] : search);
  if (limit) queryParams.append('limit', Array.isArray(limit) ? limit[0] : limit);
  if (offset) queryParams.append('offset', Array.isArray(offset) ? offset[0] : offset);

  const queryString = queryParams.toString();
  const url = `/user-management/v1/${id}/api-keys${queryString ? `?${queryString}` : ''}`;

  const response = await fetchWithCookiesServer(url, { method: 'GET' });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json() as Promise<UserGetAllApiKeysApiResponse>;
}
```

Next.js `searchParams` values are `string | string[] | undefined` — always normalize with `Array.isArray(v) ? v[0] : v` before appending. Only append params that are present; never send empty values.

## The canonical list read — what the Presenter destructures

For the list-page pattern the service is the Presenter's whole data layer. It takes the raw
`searchParams`, normalizes them, and returns the exact shape the Presenter destructures:

```typescript
const data = await getAllApiKeys(searchParams);
const pagination = data.pagination;   // { limit, offset, totalItems, totalPages }
const rows       = data.data;
const counts     = data.counts;       // { scopeCounts, statusCounts } — LabeledCount[]
```

Return `{ pagination, data, counts }` unchanged from the backend envelope. `counts` feeds
`(filter)/index.tsx`, which builds its `FilterField[]` options straight from those arrays —
`label` is the API's, never a client-side copy.

Do **not** swallow a read failure into an empty result. An empty table and a failed request
look identical to the user, and they will act on the wrong one.

## Wire-to-domain mapping

Client read hooks call the service, and the service is where the wire DTO becomes the domain type — ISO date strings become `Date`, server enums become display-ready shapes, nested payloads flatten:

```typescript
export async function getInvitations(roleId: string, params: ListParams) {
  const response = await api.getInvitations(roleId, params);
  if (!response.success) throw createApiError(response.message, 500);
  return {
    invitations: response.data.invitations.map(toInvitation), // wire → domain
    pagination: response.data.pagination,
    statusSummary: response.data.statusSummary,
  };
}
```

Components and hooks must never see raw wire shapes. `ApiResponse<T>` is a discriminated union — narrow with `if (response.success)` before reading `.data`; never `response.data?.field`.

## Orchestration

Multi-step operations (upload then attach, create then invite) are sequenced here, not in a handler and not in a component. One handler call, one service function, however many API calls it takes.

## Allowed imports

```
✅  ../api/*                              (namespace import)
✅  @repo/utilities/http/fetch-with-cookies-server   SSR reads
✅  @repo/utilities/errors/error-parsing         createApiError, getErrorStatus
✅  @repo/schemas-types                    types AND schema values, canonical names
✅  @repo/constants
✅  ../validations/schemas.ts              local UI-only schema values
✅  ../types/domain.ts, ../utils/
✅  @/shared/services/*                    session/org resolution

❌  sonner                                 toast is the handler's job
❌  react, any hook, any component         upward dependency
❌  raw fetch to a backend endpoint        use api/ or fetchWithCookiesServer
```

## Anti-patterns

| Anti-pattern | Why it breaks | Correct |
|---|---|---|
| `wrapZodError` wraps non-Zod errors in `new Error()` | Strips `.status`, breaks 422 formatting | Re-throw unchanged |
| Service imports `toast` or React | UI dependency in business logic | Move to the handler |
| `response.data?.field` without narrowing | `ApiResponse<T>` is a union; optional chaining masks type errors | `if (response.success)` first |
| Raw wire DTO returned to a hook | Leaks transport shape into the UI | Map to the domain type here |
| Schema re-exported through `validations/schemas.ts` | Pointless indirection | Import the value directly from `@repo/schemas-types` |
| `import { X as Y }` from `@repo/schemas-types` | Two names for one thing; breaks grep | Use the canonical exported name |
| Class-based service with `this` | Not the convention | Standalone exported async functions |

## Checklist

- [ ] File named `<feature>-service.ts`; standalone exported async functions
- [ ] Zod `.parse()` before the API call on mutations that the frontend validates
- [ ] `wrapZodError` re-throws non-Zod errors unchanged
- [ ] `ApiResponse<T>` narrowed with `if (response.success)` before `.data`
- [ ] Wire DTO mapped to the domain type before returning
- [ ] `searchParams` values normalized for the array case
- [ ] No `sonner`, no React, no raw backend `fetch`
- [ ] Schemas and types imported from `@repo/schemas-types` under canonical names
