---
name: backend-validation
description: Layer B3 — Zod 4 request validation in apps/backend. Use when adding a validation schema, wiring validation middleware, or coercing Express 5 params and query strings. Covers where a schema belongs (feature validations/ versus @repo/schemas-types) and the value/type split.
---

# B3 — Validation

Request-level validation is Zod 4. Where the schema lives depends on whether the frontend or admin shares it.

## Where the schema belongs

| Situation | Location |
|---|---|
| The request body shape is also sent by `apps/frontend` or `apps/admin` | `packages/schemas-types/src/payload-schemas/<domain>/<feature>/payload.schema.ts` — one schema, three apps |
| Backend-only: internal query params, worker payloads, admin-only filters | `validations/<feature>.schema.ts` inside the feature folder |

Prefer the shared package for anything a client sends. That is what keeps the error copy identical across the stack and stops the contract drifting. Only fall back to a feature-local schema when nothing outside the backend will ever produce that payload.

Folder name is `validations/` (plural). One feature uses `validation/`; that is an outlier, not a precedent.

## Value / type split

```typescript
// VALUE — runtime object, plain import; used by .parse(), validateZodSchema()
export const AdminUpdateRoleNamePayloadValidationSchema = z.object({ /* ... */ });

// TYPE — erased at compile time, import type
export type AdminUpdateRoleNamePayloadType = z.infer<typeof AdminUpdateRoleNamePayloadValidationSchema>;
```

`import type` on a schema you then pass to a validator compiles cleanly and throws at runtime. Keep the schema and its inferred type co-located.

Naming (shared package): `<Domain><Feature>PayloadValidationSchema` / `<Domain><Feature>PayloadType`. No abbreviation — these names appear in three apps.

## Zod 4 — not Zod 3

- `ZodError.format()` changed shape. **Do not depend on the nested structure.** Use `error.issues[0]?.message`.
- `z.object()` is closer to strict in some contexts — add `.passthrough()` explicitly when extra keys must survive.
- Prefer `z.discriminatedUnion()` over `z.union()` whenever a discriminant field exists — better errors, better performance.
- `.parse()` throws, `.safeParse()` returns `{ success, data, error }` — unchanged from v3.
- Put `sanitizeHtml` inside the schema's `.transform()` pipeline, not in a service, so every consumer gets the same sanitization.

## Express 5 coercion

Express 5 widened the request types. Coerce before validating:

```typescript
// req.params.id is string | string[]
const recordId = Array.isArray(req.params.recordId) ? req.params.recordId[0]! : req.params.recordId;

// req.query.* is string | string[] | ParsedQs — never assume a number
const limit = Number.parseInt(String(req.query.limit ?? "10"), 10);
```

Never pass a raw `req.params.x` or `req.query.x` into a service or a query builder. For list endpoints, do this through the shared query-param schema described in `backend-list-endpoints`.

## Error messages

Every rule carries an explicit message — it is what the user sees, in all three apps:

```typescript
z.string()
  .min(2, { message: "Name must be at least 2 characters" })
  .max(255, { message: "Name cannot exceed 255 characters" })
  .trim()
```

A Zod failure becomes HTTP **422** through `createError.validation(...)` and the global error middleware. Do not map it to 400 by hand.

## Validation-local types

A type used only by its schema stays in the validation file, next to the schema. Extract to `types/` only when controllers, services, and repositories all need it, or when it becomes a domain contract. Do not create a `types/` folder for a single validation-scoped type.

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| Backend redefines a schema the frontend already sends against | Share it via `@repo/schemas-types` |
| Relying on `ZodError.format()` structure | `error.issues[0]?.message` |
| `import type` on a schema used at runtime | Plain `import` for values |
| Raw `req.query.limit` passed to a query builder | Coerce explicitly first |
| `z.union()` where a discriminant exists | `z.discriminatedUnion()` |
| Validation error mapped to 400 | Let it be 422 via `createError.validation` |
| `sanitizeHtml` called in a service | Put it in the schema's `.transform()` |

## Checklist

- [ ] Client-facing schemas live in `@repo/schemas-types`; backend-only ones in `validations/`
- [ ] Schema VALUE and inferred TYPE co-located; values imported with `import`
- [ ] Every rule has an explicit message
- [ ] `params` / `query` coerced before use — no `string | string[]` leaking through
- [ ] `discriminatedUnion` used where a discriminant exists
- [ ] Shared-package changes rebuilt: `pnpm --filter @repo/schemas-types build`
- [ ] `pnpm --filter backend build` passes
