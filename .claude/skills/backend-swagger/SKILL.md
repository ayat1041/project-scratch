---
name: backend-swagger
description: Layer B8 — OpenAPI/Swagger documentation for apps/backend endpoints. Use when adding or updating API docs for an endpoint. Covers the swagger-docs file convention, JSDoc block structure, security schemes, response examples, and the x-order field.
---

# B8 — Swagger / OpenAPI Docs

Every endpoint is documented. Docs live in a dedicated file per action, not inline in the controller:

```
modules/<domain>/features/F<ID>-<name>/swagger-docs/<action>-<resource>.swagger.ts
```

The file contains only a `@swagger` JSDoc block — no runtime code. Swagger UI is served from `src/app/swagger-routes.ts`.

## Block structure

```typescript
/**
 * @swagger
 * /api/user-management/v1/roles/{roleId}:
 *   get:
 *     x-order: 14
 *     summary: Get role details
 *     description: Returns the role, its assigned permissions, and the users currently holding it.
 *     tags:
 *       - User Management - Roles
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Role retrieved successfully"
 *                   data:
 *                     role:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       name: "Admin"
 */
```

## Required fields

| Field | Rule |
|---|---|
| Path | The **mounted** path, including the `/api/<domain>/v1` prefix — not the router-relative path |
| Method | Lowercase, matching the route |
| `summary` | One line, imperative |
| `description` | What it returns or changes, and any non-obvious behaviour |
| `tags` | `<Domain> - <Feature Name>` — must match sibling endpoints exactly, or the endpoint lands in its own group |
| `security` | `cookieAuth: []` for authenticated routes; omit only for genuinely public ones |
| `parameters` | Every path and query param, with `schema.type` and `format` |
| `requestBody` | Required fields listed under `required:`; every property typed |
| `responses` | The success status **and** every error status the endpoint can actually return |
| `x-order` | Controls display order within the tag group. Match the neighbours in the same feature |

## Response examples

Give realistic examples, not `"string"` placeholders. Examples are what the frontend reads when wiring an `api/` function, and a wrong example costs more than no example.

Every response body follows the standard envelope:

```yaml
success: true
message: "Role retrieved successfully"
data: { ... }
```

Document the error shapes the endpoint really produces — 401 for unauthenticated, 403 when the policy denies, 404 from the existence check, 422 from Zod validation, 409 for conflicts. Do not paste a generic block of every status code.

## Keeping docs true

- Write or update the doc in the **same change** as the endpoint. A stale example is worse than a missing one because it is believed.
- Route path, permissions, and status codes must match the actual route file, policy, and validation schema.
- When a payload schema in `@repo/schemas-types` changes, update the documented body and examples with it.
- `pnpm --filter backend check:spec-drift` catches endpoint↔swagger mismatches; the pre-commit hook warns on them.

## Verify

Start the backend and open the docs UI, then confirm the endpoint appears under the right tag, in the right order, with a body that round-trips through "Try it out".

```bash
pnpm --filter backend dev
# http://localhost:8000/api-docs
```

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Router-relative path in the doc | Full mounted path with the `/api/<domain>/v1` prefix |
| Tag spelled differently from siblings | Copy the exact tag from a neighbouring endpoint |
| `"string"` / `"example"` placeholder values | Realistic values the frontend can code against |
| Every HTTP status pasted in | Only the statuses this endpoint returns |
| `security` omitted on an authenticated route | `cookieAuth: []` |
| Doc written in a later commit than the endpoint | Same change |
| Swagger JSDoc inline in the controller | Dedicated `swagger-docs/<action>.swagger.ts` |

## Checklist

- [ ] File is `swagger-docs/<action>-<resource>.swagger.ts`, JSDoc only
- [ ] Full mounted path and correct method
- [ ] `summary`, `description`, `tags`, `x-order` consistent with siblings
- [ ] `security: cookieAuth: []` unless genuinely public
- [ ] All path/query params and request-body fields documented and typed
- [ ] Success **and** real error responses documented
- [ ] Examples realistic and matching the `{ success, message, data }` envelope
- [ ] Verified in Swagger UI
- [ ] `pnpm --filter backend check:spec-drift` clean
