---
name: admin-error-handling
description: Cross-cutting — every error path in apps/admin. Use for any try/catch, toast, form error, API error, or failed SSR read. Covers the layer-by-layer conversion chain, why an SSR read must not toast, and the swallow/strip anti-patterns.
---

# Admin Error Handling

Identical to `frontend-error-handling` — same utilities, same layer contract, same modes.
An error is created in one layer, converted in another, displayed in a third.

```
api/       throw createApiError(message, status)     attaches .status / .statusCode
services/  re-throw non-Zod errors UNCHANGED         preserves .status
handlers/  handleErrorToast(error, fallback); throw  display + propagate
component/ resets loading, keeps the dialog open
Presenter  SSR read failure → error UI, NEVER a toast
```

## `@repo/utilities` error API

```typescript
// @repo/utilities/error-handling — pure
createApiError(message: string, status: number)
parseValidationErrors(message: string): string[]     // "field: msg(-)field2: msg2" → ["msg", "msg2"]
getErrorStatus(error: unknown): number | null
getErrorMessage(error: unknown, fallback: string): string

// @repo/utilities/error-handlers — UI, Sonner
handleErrorToast(error: unknown, fallback: string): void        // 422 → bullet list; else single toast
handleErrorMessage(error: unknown, fallback: string): string[]  // same parsing, no toast
```

`handleErrorToast` branches on `error.status === 422` to render a bullet list of field messages. That is why `.status` must survive the service layer intact.

## Mutations — toast + re-throw

```typescript
export const handleDeleteRole = async (roleId: string) => {
  try {
    const result = await rolesService.deleteRole(roleId);
    toast.success(result.message || 'Role deleted');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to delete role');
    throw error; // always
  }
};
```

The re-throw is what lets the component reset loading state and keep the confirm dialog open. Swallowing it leaves an admin believing a deletion succeeded.

## SSR reads never toast

The Presenter is a Server Component. There is no Sonner on the server, and a page render is not a user action.

- A failed read renders an **error state with a retry**, not a toast.
- Let the service throw and handle it at the route boundary (`error.tsx`), or return an explicit empty/error shape the Presenter renders.
- Never wrap a Presenter's service call in a try/catch that returns silently-empty data — an admin cannot distinguish "no roles" from "the API is down", and will act on the wrong conclusion.

Use `EmptySection` from `@repo/ui/components/common/table` for the genuinely-empty case, with distinct `emptyMessage` and `filteredMessage`, and a visibly different treatment for a failure.

## Forms

React Hook Form + `zodResolver` with the schema VALUE from `@repo/schemas-types`. Field errors render from `formState.errors.<field>.message`. A global form error lives in local `useState<string | null>`.

A role's `description` reaches every admin who assigns it. Validate its presence and length through the shared schema, not with an ad-hoc check, so the backend and admin agree on the rule.

## Layer responsibilities

| Layer | Job |
|---|---|
| `api/` | `throw createApiError(message, status)` with a specific fallback |
| `services/` | Re-throw non-Zod errors unchanged; narrow `ApiResponse` before reading `.data` |
| `handlers/` | `handleErrorToast` + `throw` |
| Client components | Reset loading, keep the dialog open, do not re-toast |
| Presenter | Inline error state — never a toast |

## Anti-patterns

```typescript
// ❌ Swallowing — admin can't tell the action failed
catch (error) { handleErrorToast(error, 'Failed'); }        // missing: throw error

// ❌ Re-wrapping strips .status and breaks 422 field lists
catch (error) { throw new Error((error as Error).message); }  // must be: throw error

// ❌ Silent empty on a failed SSR read — looks identical to "no data"
try { return await api.listAllRoles(params); } catch { return { roles: [] }; }

// ❌ Toast from a Server Component — there is no Sonner on the server

// ❌ Double toast — handler toasts, then the component toasts the same error again
```

Also forbidden: a local `createErrorWithStatus`; a bare `catch {}`; `console.error` as the only handling; `sonner` outside `handlers/` (except the `<Toaster />` mount in `app/layout.tsx`).

## Checklist

- [ ] `api/` throws `createApiError` with a call-specific fallback
- [ ] Service re-throws non-Zod errors unchanged
- [ ] Handler calls `handleErrorToast` **and** `throw error`
- [ ] SSR read failures render an error state, never a toast, and are distinguishable from empty
- [ ] Component resets loading on rejection and does not re-toast
- [ ] Feedback-text rules come from the shared schema
- [ ] No swallowed errors, no `sonner` outside `handlers/`
