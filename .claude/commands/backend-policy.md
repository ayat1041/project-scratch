---
description: Add or change an authorization policy action in apps/backend/src/policies, and wire the permission it depends on.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Backend Policy Action (B2)

## Step 1 — Confirm a policy is the right answer

| The question being answered | Answered by |
|---|---|
| Is the caller logged in? | `isAuthenticated` — nothing to do here |
| Does this role hold the permission at all? | `hasPermission` + `PERMISSIONS` — Step 5 |
| May *this* caller act on *these* records? | **Policy** — continue |
| Is the record in a state that allows the action? | The **controller**, in memory — stop |

A policy answers "may you", never "does the state allow it". Status and eligibility filtering is a controller job.

## Step 2 — Gather inputs

- Domain (`auth`, `user-management`, `common`)
- The action, in words: who may do what to which resource
- Which `PolicyContext` fields decide it — `userId`, `resourceOwnerId`, `organizationId`, `hasAdminPermission`, `hasBasicPermission`
- Does the existence function already supply those fields?

## Step 3 — Required reading

- Skill `backend-auth-and-policies`
- `src/policies/base.policy.ts` — `allow`, `deny`, `PolicyContext`, `AuthorizationResult`
- The existing `src/policies/<domain>.policy.ts` — extend it, do not add a parallel file

## Step 4 — Reuse before adding

Grep the domain policy for an existing action with the same semantics (`isApiKeyOwnerOrHasAdminPermission` already covers a lot). A near-duplicate action is worse than a slightly generic name — report and reuse if one fits.

## Step 5 — Wire the permission if needed

If the gate needs a permission that does not exist:

1. Add it to `PERMISSIONS` in `@repo/constants`.
2. `pnpm --filter @repo/constants build`.
3. Check the admin roles/permissions surface — a permission nobody can grant is inert.
4. Reference it in the route as `PERMISSIONS.<DOMAIN>.<NAME>`, never a string literal.

## Step 6 — Write the action

```typescript
import { allow, deny, AuthorizationResult, PolicyContext } from "@/policies/base.policy";

export const canRevokeApiKey = async (
  context: PolicyContext,
  resourceId: string,
): Promise<AuthorizationResult> => {
  if (context.hasAdminPermission) return allow();
  if (context.resourceOwnerId !== context.userId) {
    return deny(ERROR_MESSAGES.PERMISSION_DENIED);
  }
  return allow();
};

export const userManagementPolicy = { canRevokeApiKey /* , ... */ };
```

Rules:

- **No DB access inside a policy.** If a field is missing, add it to the existence function's select — that is the fix, every time.
- Return `allow()` / `deny(message)`. Never a bare boolean, never a thrown error.
- Export on the named policy object so `authorize(policy, "actionName")` resolves it.
- Pure predicate: no mutation, no logging, no queueing.

## Step 7 — Wire the route

```typescript
authorize(userManagementPolicy, "canRevokeApiKey"),
```

The action string must match a real key on the object — **a typo fails at runtime, not at build**. Grep the policy object to confirm the key after wiring.

## Step 8 — Test

Cover every context shape the action can see: owner, non-owner, admin, cross-tenant, and missing `organizationId`. A policy with only an allow-path test is untested where it matters.

```bash
pnpm --filter backend test:services
```

## Step 9 — Verify

```bash
pnpm --filter backend build
```

## Step 10 — Report

- Action name, policy object, and the `PolicyContext` fields it reads.
- Any permission added to `@repo/constants`, and whether it is grantable in admin.
- Any field added to an existence function to support it.
- Next: `/create-endpoint`.
