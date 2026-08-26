---
description: "Use when generating or updating backend GET list/read services that support filtering, selectable fields, sorting, pagination, and route-scoped params. Based on the user activity-logs query pattern in this repo."
applyTo: "apps/backend/src/**/*queries.ts,apps/backend/src/**/*queries.model.ts,apps/backend/src/**/*get-*.controller.ts,packages/validations/src/**/*.ts"
---

# GET List Service Construction Guide

Use this instruction when creating a backend read/list service or query function for a GET endpoint that supports:

- pagination
- search
- sorting
- selectable fields
- route-scoped params such as `userId`
- optional filter summaries such as counts by status

This guide is based on the patterns used in:

- `apps/backend/src/domain/common/activity-logs/queries/activity-logs.queries.ts`
- `packages/validations/src/modules/common/activity-logs.validation.ts`
- `apps/backend/src/utils/validation-function.utils.ts`
- `apps/backend/src/utils/paginated-list-query.utils.ts`

## 1. Responsibility Split

For GET list/read endpoints in this codebase, use this split:

- `packages/validations/**`
  - shared request schemas
  - shared enum-like status/filter/sort/select constants
  - request param types inferred from Zod
- `apps/backend/src/modules/**/controllers`
  - validate query + route params
  - pass validated params into the service/query layer
  - do not build SQL here
- `apps/backend/src/domain/**/queries`
  - construct the read query
  - apply route-specific scoping and filters
  - handle selectable fields, sorting, pagination, and count queries
- `apps/backend/src/constants/**` or backend-local modules
  - backend-only constants that are not shared with frontend

## 2. Constants Placement Rules

Use this rule consistently:

- Put constants in `packages` when both frontend and backend need them.
  Examples:
  - allowed filter fields
  - allowed sort fields
  - allowed selectable fields
  - status unions used in request/response contracts
- Put constants in backend code when they are backend-only.
  Examples:
  - internal exclusion states
  - backend-only fallback status handling
  - SQL/query helper defaults not needed by frontend

### Example pattern

Shared in `packages/validations`:

- `ACTIVITY_LOG_SORTABLE_FIELDS`
- `ACTIVITY_LOG_FILTERABLE_FIELDS`
- `ACTIVITY_LOG_SELECTABLE_FIELDS`
- `ActivityLogAction`
- `GetUserActivityLogsListParams`

Shared in `@repo/constants` when used across backend/frontend or across backend modules:

- `ACTIVITY_LOG_ACTION_TYPES`

Do not define these contract constants ad hoc inside the query file if they are part of the public API behavior.

## 3. Validation Pattern

### 3.1 Base pagination/query validation

Use `paginationQuerySchema` from `@repo/validations`:

```ts
import { paginationQuerySchema } from "@repo/validations";
```

This already supports:

- `limit`
- `offset`
- `fields` (generic string, refine against allowed constants in the controller)
- `search`
- `sortField`
- `sortOrder`

### 3.2 Route-specific params and filters

Add route-specific filter params in the feature validation file in `packages/validations`.

Example:

```ts
export const getUserActivityLogsSchema = z.object({
  userId: z.uuid({ message: "Invalid user ID format" }),
  action: z
    .enum([
      "login",
      "logout",
      "password_change",
      "role_assigned",
      "permission_changed",
      "all",
    ])
    .optional()
    .default("all"),
});
```

Define shared typed param interface:

```ts
export interface GetUserActivityLogsListParams extends IncomingRequestValidationParams {
  action?: z.infer<typeof getUserActivityLogsSchema.shape.action>;
  userId: z.infer<
    typeof getUserActivityLogsSchema.shape.userId
  >;
}
```

### 3.3 How `userId` is obtained in the controller

For routes guarded by `resolveResources`, do **not** read `userId` from `req.params` in the controller. Read it from `res.locals.resourceData` — it is already validated and resolved by the middleware:

```ts
const resources = res.locals.resourceData as BulkResourceData[];
const userId = resources[0]!.userId as string;
```

This avoids duplicate DB lookups and keeps the controller consistent with the workflow pattern.

## 4. Controller Pattern for GET List Endpoints

**Canonical example:** `apps/backend/src/modules/common/features/F5008-activity-logs/controllers/get-user-activity-logs.controller.ts`

Controller responsibilities:

- read `userId` (or equivalent scope) from `res.locals.resourceData` — never from `req.params`
- build the full query schema by merging `paginationQuerySchema` with feature-specific filter/sort/field extensions
- validate `req.query` using `validateZodSchema` from `@/middleware/validation.middleware` — it throws on failure, `asyncHandler` handles the error
- pass only validated, typed data to the domain query function
- return the result directly with `res.status(200).json(result)`

Do not:

- use `validateIncomingRequests` — it is a legacy utility that returns `null` on failure, bypasses error middleware, and lacks compile-time field safety
- build SQL in the controller
- re-sanitize values already handled by Zod
- read `userId` or other resolved-resource fields from `req.params`

### Canonical controller shape

```ts
import { asyncHandler } from "@/utils/async-handler";
import { validateZodSchema } from "@/middleware/validation.middleware";
import { BulkResourceData } from "@/middleware/resolve-resource.middleware";
import {
  paginationQuerySchema,
  getMyFeatureSchema,
  MY_SELECTABLE_FIELDS,
  MY_SORTABLE_FIELDS,
} from "@repo/validations";
import { z } from "zod";

const querySchema = paginationQuerySchema.extend({
  status: getMyFeatureSchema.shape.status, // feature-specific filters inline
  sortField: z.enum(MY_SORTABLE_FIELDS).optional(),
  fields: z
    .string()
    .transform((val) => val.split(",").map((f) => f.trim()))
    .refine(
      (arr) =>
        arr.every((f) =>
          (MY_SELECTABLE_FIELDS as readonly string[]).includes(f),
        ),
      { message: `fields must be one of: ${MY_SELECTABLE_FIELDS.join(", ")}` },
    )
    .optional(),
});

export const getMyListController = asyncHandler(async (req, res) => {
  // 1. Read scope from resolved resource — never from req.params
  const resources = res.locals.resourceData as BulkResourceData[];
  const userId = resources[0]!.userId as string;

  // 2. Validate query params — throws on failure, handled by asyncHandler
  const {
    limit,
    offset,
    search,
    sortOrder,
    status,
    sortField,
    fields,
  } = validateZodSchema(querySchema)(req.query);

  // 3. Delegate to the domain query layer
  const result = await getMyFeatureList({
    userId,
    limit,
    offset,
    search,
    sortOrder,
    status,
    sortField,
    fields: fields as (typeof MY_SELECTABLE_FIELDS)[number][] | undefined,
  });

  return res.status(200).json(result);
});
```

### Schema construction rules

- Start from `paginationQuerySchema` (never rebuild `limit`, `offset`, `search` etc. from scratch)
- Use `.extend()` for all additions — both feature filter fields (e.g., `status: featureSchema.shape.status`) and controller-local fields (`sortField`, `fields` refinement). Do **not** use `.merge()` — it is deprecated in Zod.
- `sortField`: always `z.enum(MY_SORTABLE_FIELDS)` — compile-time safe, not a plain `z.string()`
- `fields`: always `.refine()` against `MY_SELECTABLE_FIELDS` — the `as readonly string[]` cast is required because `z.refine` expects a plain array predicate

## 5. Query Function Signature Pattern

For list/read queries, prefer:

```ts
export const getThingList = async (
  params: GetThingListParams,
  dbOrTx: unknown = db,
): Promise<ThingListResult<Partial<ThingListItem>>> => {
  const executor = dbOrTx as typeof db;
  // query logic
};
```

Rules:

- accept a typed params object
- accept optional `dbOrTx` for transaction/test reuse
- return a typed result object
- keep the function in the domain query layer, not in the controller

## 6. Field Selection Pattern

Support both:

- a full default field set for normal responses
- a restricted `fields` selection for clients that request partial payloads

### Required structure

1. Define `defaultSelectedFields`
2. Define `selectableColumns`
3. Restrict `selectableColumns` using shared allowed field constants
4. Build `selectedFields` from requested `fields`
5. Fallback to defaults when the request does not specify fields

### Example shape

```ts
const defaultSelectedFields = {
  id: myTable.id,
  userId: myTable.userId,
  createdAt: myTable.createdAt,
  relatedUser: {
    id: users.id,
    userName: users.userName,
  },
};

const selectableColumns = {
  id: myTable.id,
  userId: myTable.userId,
  createdAt: myTable.createdAt,
} satisfies Record<AllowedSelectableField, unknown>;
```

Rules:

- nested objects are fine in `defaultSelectedFields`
- `selectableColumns` must only expose fields the API allows clients to request
- if the requested field list resolves to empty, fallback to defaults

### Status-like fields: `{ value, label }`, not a plain string

Any row field backed by an enum/status column (activity-log action type, permission category, role status, etc.) is returned as an object, not the raw string — same shape admin roles/permissions records use for `status`/`category` (`ReviewStatusField` in `common/RecordTypes.type.ts`):

```ts
status: { value: row.status, label: MY_STATUS_LABELS[row.status] };
```

- compute this **after** the raw string has been used for any internal eligibility/branching logic — don't lose the raw value before you're done with it
- if the field can be legitimately absent (not just omitted via `fields`), allow `value`/`label` to be `null` — reuse `ReviewStatusField` for that case instead of defining a new nullable variant
- omit the field entirely (not `{value: undefined, ...}`) when a caller's `fields` selection excludes it — don't fabricate a placeholder object
- `label` must come from a shared `MY_FEATURE_STATUS_LABELS` constant (see §10), not be computed ad hoc per endpoint

## 7. Route-Specific Scoping Pattern

Always separate:

- base scoping conditions
- optional filter conditions

### Base condition pattern

Use route/resource-specific constraints first:

```ts
const baseWhereConditions = [
  eq(myTable.userId, userId),
  ne(myTable.status, INTERNAL_EXCLUDED_STATUS),
];
```

Then extend them with validated optional filters:

```ts
const whereConditions = [...baseWhereConditions];

if (status && status !== "all") {
  whereConditions.push(eq(myTable.status, status));
}

if (search && search.trim()) {
  whereConditions.push(ilike(myTable.email, `%${search.trim()}%`));
}
```

Rules:

- route-specific params such as `userId` must always be in the base scope
- backend-only exclusions belong in base scope
- optional filters are appended only after validation
- never trust raw `req.query` in the query layer

## 8. Sorting Pattern

Use shared sortable field constants and `resolveSortableColumn`.

### Pattern

```ts
const sortableColumns = {
  createdAt: myTable.createdAt,
} satisfies Record<(typeof SORTABLE_FIELDS)[number], unknown>;

const sortColumn = resolveSortableColumn(
  sortField,
  sortableColumns,
  myTable.createdAt,
);
```

Then apply deterministic ordering:

```ts
const orderedQuery = baseQuery.orderBy(
  sortOrder === "desc" ? desc(sortColumn as never) : asc(sortColumn as never),
  sortOrder === "desc" ? desc(myTable.id) : asc(myTable.id),
);
```

Rules:

- always provide a fallback sort column
- always add a stable secondary sort, usually `id`
- only expose sort fields listed in shared validation constants

## 9. Pagination Pattern

Apply pagination after filtering and ordering:

```ts
const rows = await orderedQuery.limit(limit).offset(offset);
```

Return pagination metadata using the shared offset-based shape (`PAGINATION` in
`packages/schemas-types/src/payload-schemas/common/Response.type.ts`) — this is
the shape every paginated list endpoint in this codebase returns (admin
permissions, admin roles, user activity-logs, etc.):

```ts
pagination: {
  limit,
  offset,
  totalItems,
  totalPages,
}
```

Rules:

- `limit` and `offset` come from validated inputs
- `totalItems` is always computed via a count query using the same `whereConditions` as the main query — there is no `countTotal` opt-out flag; every list endpoint always counts
- `totalPages = Math.ceil(totalItems / limit)`
- do not invent a bespoke pagination shape (e.g. `currentCount`/`total: "not_counted"`) for a new endpoint — reuse `totalItems`/`totalPages` so all list responses stay consistent

## 10. Count and Summary Pattern

If the endpoint needs filter summaries such as counts by status:

- run a grouped count query using the same `whereConditions`
- normalize counts to numbers
- build a fully initialized internal summary object so missing statuses return `0`
- convert that internal object into an array of `{ value, label, count }` entries before returning — this is the shape every filter-count endpoint in this codebase returns (user activity-logs' `actionSummary`; admin permissions list's `categoryTypesCount`). Do not return the flat `{action: number}` object directly.

### Pattern

```ts
// Internal aggregation — flat object is fine here, it's never returned directly.
const countsByAction = {
  login: 0,
  logout: 0,
  password_change: 0,
  all: 0,
};

// Shape actually returned to the client — array of labeled counts, using the
// shared `LabeledCount` type (`packages/schemas-types/.../common/payload.schema.ts`).
const actionSummary: LabeledCount[] = [
  { value: "all", label: "All", count: countsByAction.all },
  { value: "login", label: MY_ACTION_LABELS.login, count: countsByAction.login },
  { value: "logout", label: MY_ACTION_LABELS.logout, count: countsByAction.logout },
];
```

Rules:

- initialize every expected summary key internally
- never return sparse summary objects — every filterable status gets an entry, even at `count: 0`
- reuse the same filters as the main data query
- `label` is the single source of truth for filter-dropdown copy — the frontend must render it directly rather than keeping its own copy of the display text
- define display labels as a shared `MY_FEATURE_STATUS_LABELS: Record<Status, string>` constant in `packages/schemas-types/constants` (mirrors `ACTIVITY_LOG_ACTION_LABELS`) so backend and frontend never diverge

## 11. Result Shape Pattern

Prefer a result object like:

```ts
{
  success: true,
  message: "My features retrieved successfully",
  pagination: { ... },
  counts: {
    statusSummary,
  },
  data: rows,
}
```

Rules:

- use explicit `success`
- always include `message` — every response in this codebase (success or error) carries one; a GET list endpoint is not an exception
- include pagination for list endpoints
- nest filter-count arrays under `counts: { ... }` (one named array per filter dimension — e.g. `counts: { holderTypesCount, reviewStatusesCount }` when there are two independent filters) rather than returning them as bare top-level fields
- include summaries only when the endpoint needs them
- type the return shape explicitly

## 12. Query Construction Rules

Follow these rules when generating a GET list query:

- keep all request validation out of the query function
- consume only typed params
- use shared field/filter/sort constants from `packages` when the frontend also depends on them
- keep backend-only exclusions or internal status handling in backend code
- join only the tables needed for selected fields, ownership context, or summary logic
- avoid N+1 by joining related users/entities directly in the query
- support transaction injection via `dbOrTx`

## 13. What To Avoid

Do not:

- define request-contract constants only in backend if frontend also uses them
- read raw `req.query` or `req.params` inside the domain query
- duplicate validation in both controller and query layer
- build sort logic directly from unsanitized strings
- return sparse count summaries
- hardcode field names outside the shared constants unless they are backend-only
- throw existence/validation errors from list-query functions when the pattern expects validated params upstream

## 14. Recommended AI Checklist

Before finalizing a generated GET list service, verify:

- [ ] Shared filter/sort/select constants live in `packages` if frontend also needs them
- [ ] Backend-only constants stay in backend code
- [ ] Route-specific params are validated through the feature schema
- [ ] Base pagination/query params are validated through `incomingRequestValidationSchema`
- [ ] Controller merges query params and route params using `validateIncomingRequests`
- [ ] Query function accepts a typed params object and optional `dbOrTx`
- [ ] Base scoping conditions are separated from optional filters
- [ ] Sorting uses `resolveSortableColumn` and a deterministic secondary sort
- [ ] Pagination metadata is returned in the standard shape
- [ ] Summary/count objects are fully initialized and use the same filters as the main query
