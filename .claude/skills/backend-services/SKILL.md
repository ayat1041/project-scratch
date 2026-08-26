---
name: backend-services
description: Layer B5 — feature services in apps/backend. Use when adding business logic, a state transition, a transaction, a queue publish, or an audit write. Covers the no-re-fetch rule, the no-service-imports-service rule, and when logic belongs in a domain model instead.
---

# B5 — Services

A service coordinates one use-case: validate state, transition it, write, queue, log. It receives everything it needs as arguments and returns a plain result.

File: `services/<action>-<resource>.service.ts` — `create-api-keys.service.ts`, `remove-api-keys.service.ts`.

## Shape

```typescript
// Receives pre-filtered ids decided by the controller
export const removeThingsService = async (eligibleIds: string[], skippedIds: string[]) => {
  if (eligibleIds.length > 0) {
    await db.update(myTable)
      .set({ deletedAt: new Date() })
      .where(inArray(myTable.id, eligibleIds));
  }
  return { removedCount: eligibleIds.length, skippedIds };
};
```

```typescript
// ✗ Re-queries existence/status that resolveResources already checked
export const removeThingsService = async (ids: string[], orgId: string) => {
  const existing = await db.select(...).where(...);   // redundant round trip
};
```

## Hard rules

- **No re-fetching.** Anything `resolveResources` loaded is already in `res.locals.resourceData` and reached the service as an argument. A `select` here to confirm existence or ownership is a bug, not a safety net.
- **No `req`, no `res`, no `res.locals`.** The controller extracts and passes. A service that reads the request cannot be tested or reused by a worker.
- **No service imports another service.** That is how the circular-dependency knots start. If two services need the same operation, lift it into `domain/<domain>/<sub>/models/` as a query or command.
- **No policy imports, no policy calls.** Authorization finished before the controller ran.
- **No controller imports.**

## Where does this logic go?

| The operation | Location |
|---|---|
| Read-only, reusable across features | `domain/.../models/<resource>-queries.model.ts` |
| Write primitive, reusable across features | `domain/.../models/<resource>-commands.model.ts` |
| Coordinates a full use-case: validation + transition + side effects + queueing + logs | Feature service |
| DB writes **plus** durable side effects (audit, event log, failure-state writes) | `<feature>.persistence.ts` in the feature's `services/` |
| Narrow CRUD for a single aggregate | `<feature>.repository.ts` |
| Pure helper, no IO | `<feature>.utils.ts` |
| Local types/constants not shared | `<feature>.types.ts` |

Rule of thumb: reads reusable broadly → domain queries. Writes reusable as a primitive → domain commands. Coordinates a whole flow → feature service.

## Transactions

Wrap multi-table writes that must succeed or fail together in a single `db.transaction`. Publish to a queue **after** the transaction commits, never inside it — a rolled-back transaction with a published message leaves the system inconsistent.

```typescript
import { eventPublisher } from "@/infrastructure/events/event-publisher";
import { ROUTING_KEYS } from "@/constants/routing-keys";

const result = await db.transaction(async (tx) => { /* ... writes ... */ });
await eventPublisher.publish(ROUTING_KEYS.USER_MANAGEMENT_API_KEY_REVOKED, job);   // after commit
```

Publish by **routing key** through `eventPublisher` — it sends to the `starter.events` topic exchange, which `QUEUE_BINDINGS` routes to the right queue. Never `channel.sendToQueue` from a service.

## Errors

Throw `createError.*` from `@/middleware/error.middleware`:

```typescript
throw createError.notFound("Api key not found");
throw createError.badRequest("Api key already revoked");
throw createError.conflict("A pending rotation already exists");
```

The deprecated `handleError` helper is **forbidden** in new or refactored code. No try/catch for the purpose of re-throwing — `asyncHandler` at the controller and the global middleware handle propagation.

## Shared contracts

Types, schemas, and constants that the frontend or admin also needs go in `@repo/schemas-types` (types and Zod schemas) or `@repo/constants` (runtime enums and permission keys), and are imported here.

> The api-workflow doc mentions `packages/types` and `packages/validations` for this. **Neither exists.** Use `@repo/schemas-types` and `@repo/constants`.

## Anti-patterns

| Anti-pattern | Why it breaks | Correct |
|---|---|---|
| Re-fetching resolved records | Extra round trip on every request | Use the controller's arguments |
| Service imports another service | Circular dependencies | Lift the shared part into `domain/.../models/` |
| Service reads `req` / `res.locals` | Untestable, unusable from a worker | Controller passes arguments |
| Service calls a policy | Authorization already ran | Trust `authorize` |
| `handleError` | Deprecated | `createError.*` |
| Queue publish inside a transaction | Message survives a rollback | Publish after commit |
| Raw SQL for something a domain command already does | Duplicate write paths drift | Reuse the domain command |
| Business logic left in the controller | Untestable without HTTP | Move it here |

## Checklist

- [ ] File is `<action>-<resource>.service.ts`
- [ ] Takes plain arguments; no `req`, `res`, or `res.locals`
- [ ] Does not re-fetch anything `resolveResources` already loaded
- [ ] Imports no other service, no policy, no controller
- [ ] Reusable reads/writes lifted into `domain/.../models/`
- [ ] Multi-table writes wrapped in a transaction; queue publishes after commit
- [ ] Errors thrown via `createError.*`; no `handleError`
- [ ] `pnpm --filter backend build` and `pnpm --filter backend test:services` pass
