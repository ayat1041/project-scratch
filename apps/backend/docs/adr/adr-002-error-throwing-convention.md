# ADR-002: Standardise Error Throwing on AppError — Retire Plain Object Throws

| Field        | Value        |
| ------------ | ------------ |
| **Status**   | Accepted     |
| **Date**     | 2026-05-14   |
| **Deciders** | Backend Team |

---

## Context

The codebase has two patterns for signalling operational errors from service and controller code.

### Pattern A — `createError.*` (AppError)

```typescript
throw createError.validation("One or more invitations cannot be resent", {
  code: "INVITATION_RESEND_INVALID_STATE",
  invalidInvitations: [{ id: "...", status: "invited" }],
});
```

`createError.*` returns an instance of `AppError`, which extends the native `Error` class and calls `Error.captureStackTrace` in its constructor. The global `errorHandler` middleware handles it in the `instanceof AppError` branch — the first branch evaluated.

### Pattern B — plain object throw

```typescript
throw {
  type: ERROR_TYPES.VALIDATION,
  message: "One or more invitations cannot be resent",
  code: "INVITATION_RESEND_INVALID_STATE",
  details: {
    invalidInvitations: [{ id: "...", status: "invited" }],
    hint: "Only invitations in eligible status can be resent.",
  },
};
```

Plain objects are caught by the `else if ("type" in error)` fallback branch in `errorHandler`. This pattern was introduced in older parts of the codebase — and later copied into new service files — primarily to attach richer inline `details` (fields like `code`, `hint`, nested arrays) that `createError.*` also accepts via its second `details` argument.

Both patterns reach the same HTTP response shape. The difference is entirely in what happens between the `throw` site and the `errorHandler`.

---

## Problem

### 1. No stack trace on plain object throws

`Error.captureStackTrace` is only called when a native `Error` (or subclass) is constructed. Throwing a plain object produces no `.stack` property. The `errorHandler` logs `error.stack` only when `error instanceof Error`:

```typescript
logger.error("Error occurred:", {
  stack: error instanceof Error ? error.stack : undefined,
});
```

In production this means every plain-object throw produces a log entry with `stack: undefined`. When an unexpected validation failure occurs in a deeply nested service call, there is no call-site information in the log — only the message.

### 2. Inconsistent `errorHandler` branch execution

`AppError` instances are handled in the first `if` block. Plain objects fall through to the second `else if` block. Both ultimately produce the same response, but the execution path is different. Adding new behaviour to the first branch (e.g., Sentry capture, structured error context enrichment) would silently miss all plain-object throw sites.

### 3. No compile-time safety on plain object fields

```typescript
throw {
  type: ERROR_TYPES.VALIDTION, // typo — no TS error
  mesage: "...", // typo — no TS error
};
```

`AppError` is a typed class. `createError.validation(message, details?)` has a known signature. Plain object literals typed as `CustomError` are checked at assignment, but a bare `throw {}` is `any` and will not catch field name typos.

### 4. The motivation for plain objects no longer exists

The plain object pattern was used to pass `details` with richer structure (e.g., `code`, `hint`, nested arrays). `createError.validation` already accepts an arbitrary `details` argument:

```typescript
createError.validation: (message: string, details?: unknown) => AppError
```

There is no field expressible in a plain object throw that cannot be expressed as the `details` argument of `createError.*`.

---

## Decision

**All new service and controller code must throw using `createError.*`. Existing plain-object throw sites must be migrated to `createError.*` when touched.**

Specific rules:

- Use `createError.validation(message, details?)` for state-transition or input validation failures.
- Use `createError.badRequest(message, details?)` for malformed or missing input at the boundary.
- Use `createError.notFound(message)` for resource-not-found conditions.
- Use `createError.conflict(message, details?)` for uniqueness or concurrent-write conflicts.
- Pass structured details (`code`, domain-specific fields, hints) as the second `details` argument — not as top-level fields on a plain object.
- Never `throw {}` or `throw { type: ERROR_TYPES.* }`.

The `CustomError` interface and the plain-object branch in `errorHandler` are **not removed** in this ADR — they remain for backward compatibility with legacy throw sites that have not yet been migrated. Removal is deferred until a full audit confirms no remaining callers.

---

## Alternatives Considered

### Option A: Keep both patterns and document when to use each

**Rejected.** Two officially sanctioned patterns means new engineers must understand both, and code review must enforce the boundary. The cost of a dual convention exceeds any benefit. `createError.*` already covers every use case of the plain object pattern.

### Option B: Replace `AppError` with plain objects everywhere for uniformity

**Rejected.** This would sacrifice stack traces and compile-time safety across the entire codebase to achieve uniformity in the wrong direction. Stack traces are non-negotiable for production observability.

### Option C: Extend `createError.*` to accept a `hint` field separately

Considered as a convenience for callers who want a typed `hint` alongside `details`.

**Deferred.** `hint` can be passed inside the `details` object today:

```typescript
createError.validation("message", { code: "...", hint: "...", items: [...] });
```

There is no runtime or consumer difference. Adding a dedicated `hint` parameter is a minor ergonomic improvement that can be done in a follow-up if the pattern becomes common enough to warrant it.

---

## Consequences

### Positive

- Every thrown error produces a stack trace visible in logs.
- All error-throw paths run through the same `instanceof AppError` branch in `errorHandler`, making it safe to add cross-cutting concerns (Sentry capture, correlation IDs, structured context) in one place.
- TypeScript enforces the constructor signature, eliminating silent field-name typos.

### Negative

- Existing plain-object throw sites are technical debt until migrated. The migration is low-risk (same HTTP output) but must be done incrementally as files are touched.
- The `CustomError` interface and its `errorHandler` branch must be maintained until migration is complete, adding a small ongoing cognitive load for anyone reading `error.middleware.ts`.
