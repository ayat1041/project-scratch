# Backend Stack Skill

Use this skill when answering questions about or making changes to `apps/backend`. It pins the **rediscovery-prone facts** that the normative instruction files don't repeat on every read.

## When To Apply

- Working in `apps/backend/src/**`, `apps/backend/scripts/**`, or `apps/backend/drizzle/**`
- Debugging Express 5 / Zod 4 specific surprises
- Authoring backend tests, schema changes, or new endpoints

If the user request is unrelated to the backend app, ignore this skill.

## Stack Versions In Use

| Package          | Version   | Notes                                    |
| ---------------- | --------- | ---------------------------------------- |
| `express`        | `^5.0.1`  | Express 5 — async errors caught natively |
| `@types/express` | `^5.0.0`  |                                          |
| `typescript`     | `5.9.2`   |                                          |
| `drizzle-orm`    | `^0.38.3` |                                          |
| `drizzle-kit`    | `^0.30.1` |                                          |
| `zod`            | `^4.1.12` | Zod 4 — error format slightly changed    |
| `pg`             | `^8.13.1` |                                          |
| `redis`          | `^4.7.0`  |                                          |
| `tsx`            | `^4.19.2` |                                          |

When in doubt, confirm with `apps/backend/package.json`.

## Express 5 Gotchas

- `req.params.id` is typed as `string | string[]` — **normalize to string** in controllers before passing to services.
- `req.query.*` is `string | string[] | ParsedQs` — parse/coerce explicitly; never assume number.
- Wildcards in route paths use `{*}`, not `*`.
- `res.json()` sets `Content-Type` automatically — do not set it manually.
- Async errors propagate to the error middleware natively; we still wrap handlers in `asyncHandler` for explicit clarity.

## Zod 4 Gotchas

- `ZodError.format()` output shape changed slightly — do not rely on the exact nested structure.
- `z.object()` defaults closer to strict in some contexts — use `.passthrough()` explicitly when extra keys must be allowed.
- Prefer `z.discriminatedUnion()` over `z.union()` when a discriminant field exists.

## Request Lifecycle (Non-Negotiable)

`isAuthenticated -> hasPermission -> resolveResources -> authorize -> controller`

- `resolveResources` is the **only** source of truth for fetched entities.
- Controllers read from `res.locals.resourceData`; never query the DB.
- Services perform mutations; never re-fetch what `resolveResources` already loaded.

## Error Handling Pattern

- Wrap async handlers in `asyncHandler`.
- Throw typed errors via `createError.*` from `@/middleware/error.middleware`.
- The deprecated `handleError` helper is **forbidden** in new/refactored code.
- Global error middleware is always the **last** middleware in app setup.

## File Structure Pattern

For a feature folder:

```
<feature>/
  controllers/<feature>.controller.ts
  services/<feature>.service.ts
  validations/<feature>.schema.ts
  swagger-docs/*.swagger.ts
  tests/integration/*.service.test.ts
  <feature>.routes.ts
  queries.model.ts
  policy.ts
  index.ts
```

Singletons (one file per role) may live at the feature root — don't force folder nesting for a single file.

## Database Conventions

- Table names: `app_` prefix.
- UUID primary keys + `createdAt`/`updatedAt` timestamps.
- Schema sources in `apps/backend/src/db/schema/**`; exports synced via `index.ts`.
- Generate migrations only via `pnpm run db:generate`; never hand-edit `drizzle/migrations/*.sql`.

## Integration Test Pattern (node:test + tsx)

- One file per service action under `<feature>/tests/integration/`.
- `node:test` + `node:assert/strict`.
- `uid()` helper for every unique DB field — never fixed strings.
- `before` seeds; `after` deletes join rows first, then parents, then `await closeDbPool()`.
- Assert thrown error types via `ERROR_TYPES.*` predicate.

Reference style: files under `apps/backend/src/modules/user-management/permissions/tests/integration/`.

## Validation Gate

After backend changes, always run from `apps/backend`:

- `pnpm run build`

Add `pnpm run lint` for code-style changes. Add `pnpm run db:generate` when schema changed.

## On-Demand Deep Reads

- ADR map: `.github/instructions/backend-adrs.instructions.md`
- Migrations: `.github/instructions/backend-migrations.instructions.md`
- Scripts: `.github/instructions/backend-scripts.instructions.md`
- Swagger authoring: `.github/instructions/api-documentation-guide.instructions.md`
- GET list pattern: `.github/instructions/get-list-service.instructions.md`
