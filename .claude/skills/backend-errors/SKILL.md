---
name: backend-errors
description: Cross-cutting — error handling in apps/backend. Use for any thrown error, asyncHandler wrapper, status-code decision, or error-middleware question. Covers createError helpers, the status map, why handleError is forbidden, and the response envelope clients depend on.
---

# Error Handling (cross-cutting)

One rule carries most of this layer: **throw, do not catch**. Controllers are wrapped in `asyncHandler`, and the global error middleware — always the **last** middleware registered — formats every failure.

```
Controller / Service
  → throw createError.*         typed, carries the status
  → asyncHandler                forwards the rejection to next()
  → global error middleware     formats { success: false, message, ... }
  → client
```

## Creating errors

```typescript
import { createError } from "@/middleware/error.middleware";

throw createError.validation("Email is required", { field: "email" });
throw createError.badRequest("Invalid password format");
throw createError.notFound("User not found");
throw createError.unauthorized("Invalid credentials");
throw createError.database("Connection failed");
```

## Status map

| Helper / type | Status | Use for |
|---|---|---|
| `validation` | 422 | Invalid input data — Zod failures land here |
| `unauthorized` | 401 | Not authenticated |
| `forbidden` | 403 | Authenticated but not permitted |
| `notFound` | 404 | Resource does not exist |
| `conflict` | 409 | State conflict — duplicate, already-processed |
| `badRequest` | 400 | Well-formed but semantically wrong |
| rate limit | 429 | Too many requests |
| `database` | 503 | Database unavailable |
| — | 500 | Unexpected; never thrown deliberately |

422 is the validation status, not 400. The frontend's `handleErrorToast` branches on 422 to render a bullet list of field messages — mapping a validation failure to 400 collapses it into one unreadable line in two client apps.

## `asyncHandler`

```typescript
export const myController = asyncHandler(async (req: Request, res: Response) => {
  // no try/catch needed
});
```

Express 5 does propagate async errors natively; the wrapper stays for explicitness and consistency. Every controller uses it.

A `try/catch` in a controller or service is almost always wrong. Catch only when you genuinely convert the failure — enrich it and re-throw, or map a third-party error into a `createError.*`. Never catch to log and swallow.

## `handleError` is forbidden

The deprecated `handleError` helper must not appear in new or refactored code. It still exists at `src/middleware/error.middleware.ts:328` (and logs its own deprecation warning), and at least one controller still imports it — `modules/common/F5004-languages/controllers/create-language.controller.ts`. That is legacy, not precedent. Replace it with `createError.*` when you touch surrounding code.

## Response envelope

Success and failure share one shape, because `ApiResponse<T>` in `@repo/schemas-types` is a discriminated union that the frontend and admin narrow on:

```json
{ "success": true,  "message": "...", "data": { } }
{ "success": false, "message": "...", "details": [ ] }
```

Never hand-shape an error response in a controller. Throw and let the middleware format it — that is what keeps the shape identical across every endpoint.

## Layer responsibilities

| Layer | Job |
|---|---|
| `validations/` + Zod | Reject malformed input → 422 |
| `resolveResources` | Missing resource → 404, before the controller runs |
| `authorize` + policy | `deny(message)` → 403 |
| Controller | Throw for request-level problems; no try/catch |
| Service | Throw for business-rule violations — `conflict`, `badRequest` |
| Domain models | Return empty/null; **do not** throw HTTP errors. The caller decides the status |
| Global middleware | Format, log, respond. Always registered last |

A domain query returning no rows is not an error — it is a fact. Whether that is a 404 depends on the caller.

## Anti-patterns

```typescript
// ❌ Swallowing
try { await doWork(); } catch (e) { logger.error(e); }

// ❌ Hand-shaped error response — diverges from the envelope
res.status(400).json({ error: "bad" });

// ❌ Validation mapped to 400 — breaks 422 bullet-list rendering in clients
throw createError.badRequest("Email is required");

// ❌ Deprecated
handleError(res, error);

// ❌ Generic message that hides the cause
throw createError.badRequest("Something went wrong");

// ❌ HTTP error thrown from a domain query
export const getUserById = async (id) => {
  const row = await db.select()...;
  if (!row) throw createError.notFound("User not found");   // caller's decision
};
```

Also: no controller without `asyncHandler`; no raw `throw new Error(...)` on a request path (it loses the status and becomes a 500); no leaking a driver or third-party error message straight to the client.

## Checklist

- [ ] Every controller wrapped in `asyncHandler`
- [ ] No `try/catch` except to genuinely convert an error
- [ ] Errors thrown via `createError.*`, never `new Error` on a request path
- [ ] Validation failures are 422
- [ ] No `handleError` in new or refactored code
- [ ] No hand-shaped error responses
- [ ] Domain models return empty rather than throwing HTTP errors
- [ ] Messages are specific and safe to show a user
- [ ] Global error middleware is registered last
