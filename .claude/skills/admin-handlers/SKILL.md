---
name: admin-handlers
description: Layer A4 — handlers in apps/admin modules. Use when adding a mutation entry point, a toast, or the UI-facing catch block for an admin action (create, update, delete). Handlers are the only place sonner is imported.
---

# A4 — Handlers

The toast boundary. The only place in `apps/admin` that imports `sonner`, aside from the `<Toaster />` mount in `app/layout.tsx`.

Every handler: call the service → `toast.success` → in `catch`: `handleErrorToast` **and** `throw error`.

## Contract

```typescript
import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/error-handlers';
import * as rolesService from '../services/roles-service';

export const handleDeleteRole = async (roleId: string) => {
  try {
    const result = await rolesService.deleteRole(roleId);
    toast.success(result.message || 'Role deleted');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to delete role');
    throw error; // always re-throw
  }
};
```

### The re-throw is not optional

The calling component needs the rejection to reset its loading state, keep the dialog open, and skip the success path. `handleErrorToast` displays; it does not stop propagation. A swallowed error leaves an admin staring at a spinner while the record is unchanged.

### Toast copy comes from the API

`toast.success(result.message || '<fallback>')`. The server owns the wording. A handler never builds its own count-dependent sentence — an admin bulk action that says "3 deleted" when the server deleted 2 is worse than no message.

## Naming and grouping

- File: `<area>.handlers.ts`, grouped by UI area — `roles.handlers.ts`, `permissions.handlers.ts`.
- Function: `handle<Action><Entity>` — `handleDeleteRole`, `handleUpdateRole`, `handleDeletePermission`.
- Exported as `const` arrow functions.
- Service imported as a namespace: `import * as rolesService from '../services/roles-service';`

## Mutations only

```
READ    Server Presenter → Service                     SSR, no toast
MUTATE  Client component → Handler → Service           toast + re-throw
MUTATE  Table-state hook → Handler → Service           toast + re-throw
```

There is no read handler in admin — identical to `apps/frontend`. Reads happen server-side
in the Presenter; a read handler would fire a toast during a page render. If you are writing
`handleGetX`, you want the Presenter or the service.

The co-located `use<Entity>Table` hook is a legitimate handler caller: its operations are
mutations, so they cross the toast boundary like any other. Handlers must therefore return
or throw in a way the hook can turn into a `boolean` for its callers.

## Destructive admin actions

Admin handlers create, update, and delete records that other users depend on for access. Two consequences:

- The **component** confirms before calling — a controlled confirm dialog, never a bare button wired straight to the handler.
- The handler still re-throws on failure, so a failed deletion does not leave the UI showing the record as removed.

The handler itself does not confirm; confirmation is UI, and putting it here makes the handler untestable and unusable from any other caller.

## Allowed imports

```
✅  sonner
✅  @repo/utilities/error-handlers        handleErrorToast, handleErrorMessage
✅  ../services (namespace import)
✅  ../types/domain, ../utils/, @repo/schemas-types, @repo/constants

❌  ../api/*        skips service-layer validation
❌  fetch
❌  React, hooks, components
❌  business logic, transformation   → those belong in the service
```

## Anti-patterns

| Anti-pattern | Why it breaks | Correct |
|---|---|---|
| `handleErrorToast` without `throw error` | Component can't reset loading state | Always re-throw |
| Handler imports `api/` directly | Skips service validation and transformation | Handler → service → api |
| Toast built from a local count | Diverges from what the server actually did | Use `result.message` |
| Business logic in the handler | Untestable outside React | Move to the service |
| `handleGetX` read handler | Toast during a page render | Presenter reads via the service |
| Confirmation dialog inside the handler | Handler becomes UI-bound | Confirm in the component |
| `sonner` outside `handlers/` | Breaks the toast boundary | Move the call into a handler |

## Checklist

- [ ] File named `<area>.handlers.ts`, grouped by UI area
- [ ] Function named `handle<Action><Entity>`
- [ ] Service imported as a namespace
- [ ] `toast.success(result.message || fallback)` on success
- [ ] `handleErrorToast(error, fallback)` **and** `throw error` in catch
- [ ] No `api/` import, no `fetch`, no React
- [ ] Mutation only
- [ ] Destructive actions confirmed in the component, not here
