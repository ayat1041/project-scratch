---
name: backend-controllers
description: Layer B4 — Express controllers in apps/backend. Use when adding or reviewing a controller. Covers asyncHandler, reading res.locals.resourceData instead of re-querying, in-memory eligibility filtering, response shape, and what must be pushed down to the service.
---

# B4 — Controllers

A controller orchestrates request and response. It reads what the middleware already resolved, decides what is eligible, calls one service, and shapes the response. **It never touches the database.**

File: `controllers/<action>-<resource>.controller.ts` — one controller per file, e.g. `update-role-name.controller.ts`, `get-all-activity-logs.controller.ts`.

## Shape

```typescript
import { BulkResourceData } from "@/middleware/resolve-resource.middleware";

type ResolvedMyResource = BulkResourceData<MyDataType>;

export const myController = asyncHandler(async (req: Request, res: Response) => {
  const resourceData = res.locals.resourceData as ResolvedMyResource[];

  // Single resource
  const record = resourceData[0].data!;
  const organizationId = resourceData[0].organizationId as string;

  // Bulk — filter in memory using data already fetched
  const eligibleIds = resourceData.filter((r) => r.data!.status === "active").map((r) => r.data!.id);
  const skippedIds = resourceData.map((r) => r.data!.id).filter((id) => !eligibleIds.includes(id));

  const result = await myService(eligibleIds, skippedIds);

  res.status(200).json({ success: true, data: result });
});
```

## Rules

- **Wrap in `asyncHandler`** (from `@/utils/async-handler`). Async errors then reach the global error middleware without a try/catch.
- **`res.locals.resourceData` is the source of truth** for anything `resolveResources` fetched. It is always an array, even for a single-param route.
- **Never re-query.** If you find yourself needing a field that is not on `data`, add it to the existence function's select — do not add a second round trip here.
- **Filter in memory here.** Status checks, soft-delete checks, and eligibility splits use the already-fetched `data` fields. This is exactly why the existence function selects those fields.
- **Pass computed inputs down.** The service receives `eligibleIds` / `skippedIds`, not the raw request.
- Get the caller from `getUserIdFromAuth(res)`, never from `req.body`.
- Normalize Express 5 params before use — `req.params.id` is `string | string[]`.
- No `try/catch`. Throw via `createError.*`; `asyncHandler` and the global middleware do the rest.
- No business logic beyond the eligibility split — state transitions, side effects, queueing, and logging belong to the service.

## Response shape

```typescript
res.status(200).json({ success: true, data: result });
res.status(201).json({ success: true, data: created });
res.status(200).json({ success: true, message: "Role updated" });
```

Always the `{ success, data?, message? }` envelope — it is what `ApiResponse<T>` in `@repo/schemas-types` narrows on, and what every frontend and admin `api/` function expects. A bespoke shape breaks discriminated-union narrowing in two client apps.

Errors are never hand-shaped. `throw createError.notFound("Role not found")` and let the global middleware format it.

## Where the boundary sits

| Job | Layer |
|---|---|
| Read resolved records | Controller |
| Decide which records are eligible | Controller (in memory) |
| Normalize params / coerce query | Controller |
| Shape the HTTP response | Controller |
| Mutate, transition state, queue, log | Service |
| Reusable read or write primitive | `domain/.../models/` |

## Anti-patterns

| Anti-pattern | Why it breaks | Correct |
|---|---|---|
| DB query in a controller | Duplicates what `resolveResources` did; extra round trip | Read `res.locals.resourceData` |
| Controller not wrapped in `asyncHandler` | Rejected promise escapes the error middleware | Wrap it |
| `try/catch` in a controller | Duplicates the global handler, usually swallows status | Throw `createError.*` |
| Raw `req.body` passed straight to a service | Skips the eligibility split; service ends up re-reading the request | Pass computed arguments |
| `userId` read from `req.body` | Trivially spoofable | `getUserIdFromAuth(res)` |
| `req.params.id` used unnormalized | Express 5 types it `string \| string[]` | Coerce first |
| Custom response envelope | Breaks `ApiResponse<T>` narrowing in frontend and admin | `{ success, data }` |
| Business logic in the controller | Untestable without an HTTP layer | Move to the service |

## Checklist

- [ ] File is `<action>-<resource>.controller.ts`, one controller per file
- [ ] Wrapped in `asyncHandler`, no `try/catch`
- [ ] Reads `res.locals.resourceData`; issues no query of its own
- [ ] Eligibility filtering done in memory from resolved `data`
- [ ] Service called with computed arguments, not `req`
- [ ] `getUserIdFromAuth(res)` for the caller id
- [ ] Params coerced from `string | string[]`
- [ ] Response uses the `{ success, data?, message? }` envelope
- [ ] `pnpm --filter backend build` passes
