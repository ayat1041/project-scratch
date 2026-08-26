---
description: Add a service function to a frontend module's services/ layer (L6) — Zod validation, wire-to-domain mapping, SSR reads, or multi-step orchestration.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Service Function (L6)

## Step 1 — Gather inputs

- Target module and the `api/` function(s) this service will call
- Mutation or read? If read: SSR (`page.tsx`) or client (React Query hook)?
- Does the frontend validate, or does the backend own every rule?
- Is a wire→domain mapping needed (ISO strings → `Date`, nested → flat, server enum → display shape)?
- Multi-step? If so, the exact order and what happens if step 2 fails.

## Step 2 — Required reading

- Skill `frontend-services`
- The module's existing `services/<feature>-service.ts`

## Step 3 — Write the function

Standalone `export async function` — no class, no `this`.

**Mutation with frontend validation:**

```typescript
export async function updateName(id: string, payload: UserManagementUpdateNamePayloadType) {
  try {
    const data = UserManagementUpdateNamePayloadValidationSchema.parse(payload);
    return api.updateName(id, data);
  } catch (error) {
    wrapZodError(error);
  }
}
```

`wrapZodError` converts `ZodError` to a plain `Error` and re-throws **everything else unchanged**. Wrapping a non-Zod error in `new Error(message)` strips `.status`/`.statusCode` and breaks 422 toast formatting.

**Mutation where the backend owns validation:** forward the payload directly and let the API surface the 422. Do not invent a frontend schema to mirror the backend.

**SSR read:**

```typescript
const response = await fetchWithCookiesServer(url, { method: 'GET' });
if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
return response.json() as Promise<UserManagementGetAllApiKeysApiResponse>;
```

Normalize Next.js `searchParams` (`string | string[] | undefined`) with `Array.isArray(v) ? v[0] : v`, and append only present params.

**Client read:** call `api.getX()`, narrow with `if (!response.success) throw ...`, then map the wire DTO to the domain type before returning. Hooks and components must never see a raw wire shape.

## Step 4 — Constraints

- No `sonner`, no React, no hooks, no components
- No raw `fetch` to a backend endpoint — use `api/` or `fetchWithCookiesServer`
- `ApiResponse<T>` narrowed with `if (response.success)` before reading `.data`; never `response.data?.field`
- Schemas and types imported from `@repo/schemas-types` under canonical names, no alias
- Add `services/index.ts` only when the folder gains a second file

## Step 5 — Verify

```bash
pnpm --filter frontend lint
pnpm --filter frontend check-types
```

## Step 6 — Report

- Function signature, and what it validates / transforms / orchestrates.
- Next: `/frontend-handler` for a mutation, `/frontend-hook` for a client read, `/frontend-page` for an SSR read.
