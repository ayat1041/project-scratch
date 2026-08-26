---
description: Add a mutation handler to a frontend module's handlers/ layer (L5) — the toast boundary, with the mandatory re-throw.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Handler (L5)

## Step 1 — Confirm a handler is the right layer

| The call is | Layer |
|---|---|
| A mutation the user triggered (save, delete, invite, upload) | **Handler** — continue |
| A read (page load, table fetch, list refresh) | **Hook** — stop, run `/frontend-hook` |
| A real-time availability check while the user types | Handler, but the `handleErrorMessage` variant — see Step 5 |
| Auth sign-in / sign-up | Handler, but throws `AuthApiError` — see Step 6 |

A read handler puts a toast on page load. If you are about to write `handleGetX`, you want a hook.

## Step 2 — Gather inputs

- Target module and the service function to call
- The action and entity, for the `handle<Action><Entity>` name
- Which UI area owns it — that picks the `<area>.handlers.ts` file
- The fallback toast message for failure (short, plain, no punctuation flourish)

## Step 3 — Required reading

- Skill `frontend-handlers`
- Skill `frontend-error-handling`
- The module's existing `handlers/<area>.handlers.ts`

## Step 4 — Write the standard handler

```typescript
export const handleCreateApiKey = async (
  userId: string,
  payload: UserManagementApiKeyMutationData
): Promise<void> => {
  try {
    const result = await apiKeyService.createApiKey(userId, payload);
    toast.success(result.message || 'API key saved');
  } catch (error) {
    handleErrorToast(error, 'Failed to save API key');
    throw error;
  }
};
```

- Service imported as a namespace: `import * as apiKeyService from '../services/api-keys-service';`
- Success copy is `result.message` with a short fallback. The server owns wording and pluralization — never build a count-dependent sentence here.
- `handleErrorToast(error, fallback)` **and** `throw error`. Both. The re-throw is what lets the component reset loading state and keep the dialog open.
- Grouped by UI area, not by entity: `header.handlers.ts`, `api-keys.handlers.ts`.

## Step 5 — Inline-validation variant

Real-time availability checks return `string[]` and neither toast nor throw:

```typescript
export const handleCheckApiKeyLabel = async (userId: string, label: string) => {
  try {
    return await apiKeyService.checkApiKeyLabel(userId, { label });
  } catch (error) {
    return handleErrorMessage(error, 'Failed to check API key label'); // string[]
  }
};
```

## Step 6 — Auth variant

Auth handlers do **not** call `handleErrorToast`. They throw `AuthApiError` so the form can call `parseSignInError` and place field-level errors.

## Step 7 — Constraints

- No `../api/*` import — that skips service-layer validation
- No `fetch`, no React, no business logic or transformation
- `sonner` is imported here and nowhere else in the module
- Add `handlers/index.ts` only when the folder gains a second file

## Step 8 — Verify

```bash
pnpm --filter frontend lint
pnpm --filter frontend check-types
```

Then grep the module to confirm `sonner` appears only under `handlers/`.

## Step 9 — Report

- Handler name, file, and the service call it wraps.
- Confirm the re-throw is present.
- Next: `/frontend-component` for the trigger.
