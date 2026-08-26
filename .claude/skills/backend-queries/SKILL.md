---
name: backend-queries
description: Layer B6 — the domain data-access layer in apps/backend/src/domain. Use when adding a reusable read (queries.model) or write primitive (commands.model), an existence check, or deciding whether an operation belongs in the domain layer versus a feature service.
---

# B6 — Domain Queries and Commands

`src/domain/` holds data access that more than one feature can reuse. It is the only layer below services that talks to Drizzle directly for shared operations.

```
src/domain/<domain>/<subdomain>/models/
├── <resource>-queries.model.ts     read-only
└── <resource>-commands.model.ts    write primitives
```

Domains in use: `users`. Add a new top-level domain folder (e.g. `common/`) when a feature's data access needs to be shared outside `users`.

## Queries vs. commands vs. feature service

| Choose | When |
|---|---|
| `queries.model.ts` | Read-only. Used by `resolveResources`, list endpoints, detail endpoints, search/filter. Returns data for policies and controllers without mutating |
| `commands.model.ts` | Direct mutation (insert/update/delete). A reusable write primitive several services can orchestrate. Transactional write helpers that are still domain-level building blocks |
| Feature service | Workflow orchestration — validation, state transitions, side effects, queueing, logs. Tightly coupled to one API journey |

Rule of thumb: reads reusable broadly → domain queries. Writes reusable as a primitive → domain commands. Coordinates a full use-case → feature service.

## Existence checks

The most common query-model export. It feeds `resolveResources`:

```typescript
import { ExistenceCheckResult } from "@/middleware/resolve-resource.middleware";

export const apiKeysExist = async (
  ids: string[],
): Promise<ExistenceCheckResult<ApiKeyData>> => {
  const records = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      status: apiKeys.status,           // controller filters on this
      name: apiKeys.name,
    })
    .from(apiKeys)
    .where(inArray(apiKeys.id, ids));

  return {
    resources: records.map((record) => ({
      resourceId: record.id,
      userId: record.userId,
      organizationId: null,
      data: record,
    })),
  };
};
```

- Select **exactly** what the controller and policy need. This runs on every request to the route.
- Include the fields the controller filters on — that is what replaces a second query.
- Always populate `userId` for user-owned resources, `organizationId` for org-scoped ones; `authorize` and the controller both read them.

## Rules

- One file per resource, named `<resource>-queries.model.ts` / `<resource>-commands.model.ts`.
- Exported functions take plain arguments and return plain data. No `req`, no `res`, no HTTP concepts, no `createError` for flow control — a "not found" is an empty array, and the caller decides whether that is a 404.
- No imports from `modules/` — the dependency runs one way, features depend on domain.
- No orchestration: a domain function does one data operation. Sequencing two of them is a service's job.
- Accept an optional transaction handle when a command needs to participate in a caller's transaction.
- Keep a re-export shim when moving a path, so old imports keep working during a migration (see `domain/users/models/api-keys/api-keys-queries.model.ts`).

## Naming

| Kind | Pattern | Example |
|---|---|---|
| Existence check | `<resources>Exist` | `apiKeysExist`, `rolesExist` |
| List read | `get<Resources>List` | `getApiKeysList` |
| Detail read | `get<Resource>ById` | `getApiKeyById` |
| Write primitive | `<verb><Resource>` | `insertApiKey`, `markApiKeyRevoked` |

## Anti-patterns

| Anti-pattern | Correct |
|---|---|
| A feature service issuing raw Drizzle for something reusable | Lift it into a domain query/command |
| A domain function importing from `modules/` | Domain has no upward dependencies |
| A domain function orchestrating several writes plus a queue publish | That is a feature service |
| `select *` in an existence check | Select only what the controller and policy read |
| Two services duplicating the same query | One domain query, imported twice |
| Throwing `createError.notFound` from a domain read | Return empty; the caller decides the status |

## Checklist

- [ ] File is `<resource>-queries.model.ts` or `<resource>-commands.model.ts` under `domain/<domain>/<sub>/models/`
- [ ] Plain arguments in, plain data out — no HTTP concepts
- [ ] Existence checks return `resourceId`, `userId`, `organizationId`, `data`
- [ ] Field selection is exactly what the caller needs
- [ ] No imports from `modules/`
- [ ] Commands accept an optional transaction handle where relevant
- [ ] `pnpm --filter backend build` passes
