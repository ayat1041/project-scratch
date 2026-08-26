---
description: Add a mutation handler to an admin module's handlers/ layer (A4) — the toast boundary, with the mandatory re-throw.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Admin Handler (A4)

## Step 1 — Confirm a handler is the right layer

| The call is | Layer |
|---|---|
| A mutation an admin triggered (approve, reject, request update, suspend) | **Handler** — continue |
| A read (table load, detail page) | **Presenter → service** — stop, no handler exists for reads in admin |

A read handler would toast during a page render. If you are writing `handleGetX`, you want the Presenter.

## Step 2 — Gather inputs

- Target module and the service function to call
- Action and entity, for the `handle<Action><Entity>` name
- Which UI area owns it — picks the `<area>.handlers.ts` file
- The failure fallback message (short, specific, plain)
- Is the action destructive or visible to the affected user(s)?

## Step 3 — Required reading

- Skill `admin-handlers`
- Skill `admin-error-handling`
- The module's existing `handlers/<area>.handlers.ts`

## Step 4 — Write it

```typescript
export const handleDeactivateRole = async (
  roleId: string,
  payload: DeactivateRolePayloadType
) => {
  try {
    const result = await rolesService.deactivateRole(roleId, payload);
    toast.success(result.message || 'Role deactivated');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to deactivate role');
    throw error;
  }
};
```

- Service imported as a namespace: `import * as rolesService from '../services/roles-service';`
- Success copy is `result.message` with a short fallback. The server owns the wording — never build a count-dependent sentence here; "3 deactivated" when the server deactivated 2 is worse than no message.
- `handleErrorToast(error, fallback)` **and** `throw error`. Both. The re-throw is what resets loading state and keeps the confirm dialog open — without it, an admin believes a failed deactivation succeeded.
- Grouped by UI area: `roles.handlers.ts`, `role-detail.handlers.ts`.

## Step 5 — Destructive actions

Admin actions change records that determine what other users can do on the platform, and the effect is immediately visible to them.

- Confirmation is the **component's** job — a controlled confirm dialog. Do not put a confirm inside the handler; that makes it untestable and unusable from another caller.
- A deactivation reason shown to affected users is validated through the shared schema in `@repo/schemas-types`, so admin and backend agree on the rule.
- The re-throw matters most here: a swallowed failure on a deactivation is the worst outcome in this app.

## Step 6 — Constraints

- No `../api/*` import — that skips service-layer validation and transformation
- No `fetch`, no React, no business logic
- `sonner` is imported here and nowhere else in the module

## Step 7 — Verify

```bash
pnpm --filter admin lint
pnpm --filter admin check-types
```

Then grep the module to confirm `sonner` appears only under `handlers/`.

## Step 8 — Report

- Handler name, file, and the service call it wraps.
- Confirm the re-throw is present.
- Where confirmation happens for a destructive action.
- Next: `/admin-component` for the trigger.
