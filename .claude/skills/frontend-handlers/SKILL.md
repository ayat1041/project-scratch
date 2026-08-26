---
name: frontend-handlers
description: Layer L5 — handlers in modules/<domain>/<feature>/handlers. Use when adding or reviewing a mutation entry point, a toast, or the UI-facing catch block. Handlers are the only place sonner is imported. Covers the toast-and-re-throw contract, handler grouping, and the no-read-handler rule.
---

# L5 — Handlers (`handlers/`)

The handler layer is the **toast boundary** and nothing else. It is the only place in `apps/frontend` that imports `sonner`.

Every handler: call the service → `toast.success` → in `catch`: `handleErrorToast` **and** `throw error`.

## The contract

```typescript
import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/error-handlers';
import * as apiKeyService from '../services/api-keys-service';
import type { ApiKeyMutationData } from '../services/api-keys-service';

export const handleCreateApiKey = async (
  userId: string,
  payload: ApiKeyMutationData
): Promise<void> => {
  try {
    const result = await apiKeyService.createApiKey(userId, payload);
    toast.success(result.message || 'API key created');
  } catch (error) {
    handleErrorToast(error, 'Failed to create API key');
    throw error; // always re-throw
  }
};
```

### Why `throw error` is non-negotiable

The calling component needs the rejection to reset its loading state, keep the dialog open, and skip the success path. A swallowed error leaves a spinner running forever. `handleErrorToast` displays; it does not stop propagation.

### Toast copy comes from the API

`toast.success(result.message || '<fallback>')` — the server owns the wording and any pluralization. A handler never builds its own count-dependent sentence. The fallback is a short, plain string used only when the response omits `message`.

## Naming and grouping

- File: `<area>.handlers.ts` — grouped **by UI area, not by entity**: `header.handlers.ts`, `content.handlers.ts`, `invitations.handlers.ts`, `api-keys.handlers.ts`.
- Function: `handle<Action><Entity>` — `handleCreateApiKey`, `handleRotateApiKey`, `handleUpdateName`.
- Exported as `const` arrow functions.
- `handlers/index.ts` barrel only when the module has more than one handler file.
- Import the service as a namespace: `import * as apiKeyService from '../services/api-keys-service';`

## Mutations only — there is no read handler

```
READ    Component → Hook    → Service      inline error state, no toast
MUTATE  Component → Handler → Service      toast + re-throw
```

A read handler would fire a toast on page load. If you are writing `handleGetX`, you want a hook.

## The one exception — inline validation

Real-time async availability checks (name/URL uniqueness while the user types) return `string[]` instead of toasting:

```typescript
export const handleCheckUrl = async (id: string, url: string): Promise<string[]> => {
  try {
    return await userProfileService.checkUrl(id, url);
  } catch (error) {
    return handleErrorMessage(error, 'Failed to check URL'); // string[], no toast, no throw
  }
};
```

`handleErrorMessage` comes from `@repo/utilities/error-handlers`. This is the **only** case where a handler neither toasts nor re-throws. See `frontend-error-handling`, Mode 2.

## Auth — check before you follow the doc

`frontend-error-handling.instructions.md` describes auth handlers throwing `AuthApiError` so the form can call `parseSignInError` and place field-level errors. **Neither symbol exists in the repo.** `modules/auth/handlers/sign-in.handlers.ts` today follows the standard shape — `toast.success`, `handleErrorToast`, re-throw.

Match the code that exists. If a task genuinely needs field-level auth errors, building `AuthApiError` and `parseSignInError` is part of that task, not an assumed dependency.

## Allowed imports

```
✅  sonner
✅  @repo/utilities/error-handlers   (handleErrorToast, handleErrorMessage)
✅  ../services (namespace import)
✅  types/domain.ts, utils/, @repo/schemas-types, @repo/constants
✅  <domain>/private/handlers/       when reusing the immediate parent's shared stack

❌  ../api/*                          skips service-layer validation
❌  fetch
❌  React, hooks, components
❌  business logic, transformation, orchestration   → those belong in the service
```

## Anti-patterns

| Anti-pattern | Why it breaks | Correct |
|---|---|---|
| `handleErrorToast` without `throw error` | Component can't reset loading state | Always re-throw |
| Handler imports `api/` directly | Skips Zod validation in the service | Handler → service → api |
| Toast built from a local count/pluralization | Diverges from server copy | Use `result.message` |
| Business logic in the handler | Untestable outside React | Move to the service |
| `handleGetX` read handler | Toast on page load | Use a React Query hook |
| `sonner` imported outside `handlers/` | Breaks the toast boundary | Move the call into a handler (the sole legitimate exception is the `<Toaster />` mount in `app/layout.tsx`) |

## Checklist

- [ ] File named `<area>.handlers.ts`, grouped by UI area
- [ ] Function named `handle<Action><Entity>`
- [ ] Service imported as a namespace
- [ ] `toast.success(result.message || fallback)` on success
- [ ] `handleErrorToast(error, fallback)` **and** `throw error` in catch
- [ ] No `api/` import, no `fetch`, no React
- [ ] Mutation only — reads go through a hook
