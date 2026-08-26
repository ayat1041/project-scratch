---
name: backend-list-endpoints
description: The GET list endpoint pattern for apps/backend — filtering, sorting, pagination, counts, and the response envelope. Use for any endpoint returning a filtered or paginated collection. Spans validation, controller, and domain query, and pins the shared response shape all three apps consume.
---

# GET List Endpoints

Every list endpoint in this codebase follows one shape. Do not invent a one-off query/controller structure — the frontend and admin table components are written against this envelope.

Use alongside `backend-routes` and `backend-controllers` for the lifecycle; this skill covers only what is list-specific.

## Responsibility split

| Layer | Job |
|---|---|
| `@repo/schemas-types` | Shared request schemas; filterable/sortable/selectable field constants; status unions; display labels |
| `@repo/constants` | Runtime enums shared with the frontend |
| Controller | Validate query params, merge with route params, pass typed params down. **Never builds SQL** |
| `domain/.../queries` | Construct the query: scoping, filters, field selection, sorting, pagination, counts |
| `src/constants/**` | Backend-only constants (internal exclusion states, query defaults) |

> The `get-list-service.instructions.md` guide says shared constants live in `packages/validations` / `@repo/validations`. **That package does not exist.** The real home is `@repo/schemas-types` — `paginationQuerySchema` and `LabeledCountSchema` are exported from `payload-schemas/common/`, and the admin roles/permissions schemas are the working reference.

## Constants placement

Shared in `@repo/schemas-types` when the frontend also depends on them:

- allowed filter fields, sort fields, selectable fields
- status unions used in request/response contracts
- `<FEATURE>_STATUS_LABELS: Record<Status, string>` — the single source of filter-dropdown copy

Backend-only, kept in backend code: internal exclusion states, fallback status handling, SQL helper defaults.

Never define a contract constant ad hoc inside the query file.

## Validation

Compose from `paginationQuerySchema` (`@repo/schemas-types/payload-schemas/common/payload.schema`), which already covers `limit`, `offset`, `fields`, `search`, `sortField`, `sortOrder`:

```typescript
export const getUserActivityLogsSchema = z.object({
  userId: z.uuid({ message: "Invalid user ID format" }),
  operationType: z.enum(["create", "update", "delete", "all"])
    .optional()
    .default("all"),
});

export interface GetUserActivityLogsListParams extends IncomingRequestValidationParams {
  operationType?: z.infer<typeof getUserActivityLogsSchema.shape.operationType>;
  userId: z.infer<typeof getUserActivityLogsSchema.shape.userId>;
}
```

Refine `fields` against the allowed-selectable constant **in the controller**, not in the query.

## Controller

Merge validated query params with route params, then hand a typed object to the query.

On a route guarded by `resolveResources`, **do not read `organizationId` from `req.params`** — it is already resolved:

```typescript
const resources = res.locals.resourceData as BulkResourceData[];
const organizationId = resources[0]!.organizationId as string;
```

That avoids a duplicate lookup and keeps the controller consistent with the lifecycle.

## Query construction

- Separate **base scoping conditions** (ownership, soft-delete, tenancy) from **optional filters**. Build `whereConditions` once and reuse it for the data query, the count query, and the summary query.
- Join only the tables needed for selected fields, ownership context, or summary logic. Join related entities directly rather than looping — no N+1.
- Sorting goes through `resolveSortableColumn` (from `@/utils/paginated-list-query.utils`) against the shared sortable-fields constant, never a raw string off the request. Always add a **deterministic secondary sort** (typically `id`) so pagination is stable.
- Accept an optional `dbOrTx` so the query can run inside a caller's transaction.
- Consume typed params only. No `req.query` / `req.params` inside the query function, and no validation duplicated here.

## Pagination

```typescript
const rows = await orderedQuery.limit(limit).offset(offset);

pagination: { limit, offset, totalItems, totalPages }
```

- `totalItems` always comes from a count query using the **same `whereConditions`**. There is no opt-out — every list endpoint counts.
- `totalPages = Math.ceil(totalItems / limit)`.
- Do not invent a bespoke shape (`currentCount`, `total: "not_counted"`). Every list response uses `totalItems` / `totalPages`.

## Filter counts

Aggregate internally as a flat object, but **return an array of labeled counts**:

```typescript
// internal — never returned directly
const countsByOperation = { create: 0, update: 0, delete: 0, all: 0 };

// returned shape
const operationSummary: LabeledCount[] = [
  { value: "all",    label: "All",                        count: countsByOperation.all },
  { value: "create", label: MY_STATUS_LABELS.create,      count: countsByOperation.create },
  { value: "update", label: MY_STATUS_LABELS.update,      count: countsByOperation.update },
];
```

- Initialize **every** expected key, so a missing status returns `0` rather than being absent. Sparse summaries break the frontend's filter dropdown.
- Use the same `whereConditions` as the data query.
- `label` is the source of truth for dropdown copy — the frontend renders it directly rather than keeping its own strings. Define labels as a shared `<FEATURE>_STATUS_LABELS` constant so the two never diverge.
- Normalize counts to numbers; a grouped count comes back as a string from Postgres.

## Response envelope

```typescript
{
  success: true,
  message: "My features retrieved successfully",
  pagination: { limit, offset, totalItems, totalPages },
  counts: { operationSummary },
  data: rows,
}
```

- `success` explicit, `message` always present — every response in this codebase carries one, GET included.
- Filter-count arrays nest under `counts`, one named array per filter dimension (`counts: { operationTypesCount, activityStatusesCount }`), never as bare top-level fields.
- Type the return shape explicitly.

## What to avoid

- Contract constants defined only in backend when the frontend needs them too
- Raw `req.query` / `req.params` read inside a domain query
- Validation duplicated in both controller and query
- Sort built from an unsanitized string
- Sparse count summaries
- A bespoke pagination or counts shape for "just this one endpoint"
- Existence/validation errors thrown from a list query — params arrive validated

## Checklist

- [ ] Shared filter/sort/select constants and status labels live in `@repo/schemas-types`
- [ ] Backend-only constants stay in backend code
- [ ] Route-specific params validated through the feature schema; base params through `paginationQuerySchema`
- [ ] Controller merges query + route params and refines `fields` against the allowed list
- [ ] `organizationId` read from `res.locals.resourceData`, not `req.params`
- [ ] Query takes typed params plus optional `dbOrTx`
- [ ] Base scoping separated from optional filters; one `whereConditions` reused by data, count, and summary
- [ ] Sorting via `resolveSortableColumn` with a deterministic secondary sort
- [ ] `totalItems` counted with the same conditions; `totalPages` derived
- [ ] Summaries returned as fully-initialized `LabeledCount[]` under `counts`
- [ ] Response includes `success`, `message`, `pagination`, `data`
- [ ] `pnpm --filter backend build` passes
