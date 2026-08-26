---
name: frontend-error-handling
description: Cross-cutting — every error path in apps/frontend. Use for any try/catch, toast, inline validation state, API error, form error, or auth field error. Covers the four display modes, where each layer converts an error, the @repo/utilities error API, and the swallow/strip anti-patterns.
---

# Error Handling (cross-cutting)

An error is created in one layer, converted in another, and displayed in a third. Each layer has exactly one job.

```
api/       throw createApiError(message, status)      attaches .status / .statusCode
services/  wrapZodError(error)                        ZodError → plain Error; everything else re-thrown UNCHANGED
handlers/  handleErrorToast(error, fallback); throw   display + propagate
hooks/     handleErrorMessage(error, fallback)        string[] for inline display, no toast
component/ renders toast-free inline state            RHF errors, field errors, error banners
```

## `@repo/utilities` error API

```typescript
// @repo/utilities/error-handling  — pure, no UI
createApiError(message: string, status: number)     // Object.assign(new Error(message), { status, statusCode })
parseValidationErrors(message: string): string[]    // "field: msg(-)field2: msg2" → ["msg", "msg2"]
getErrorStatus(error: unknown): number | null       // .status ?? .statusCode ?? null
getErrorMessage(error: unknown, fallback: string): string

// @repo/utilities/error-handlers  — UI, uses Sonner
handleErrorToast(error: unknown, fallback: string): void        // 422 → bullet list; else single toast
handleErrorMessage(error: unknown, fallback: string): string[]  // same parsing, returns strings
```

`handleErrorToast` internally:

```
error.status === 422  → parseValidationErrors(message) → toast.error(<bullet list>)
error.status !== 422  → toast.error(error.message || fallback)
```

This is why `.status` must survive the service layer. Strip it and every 422 collapses into one unreadable concatenated string.

## Mode 1 — Toast (save / upload / delete)

```typescript
export const handleUploadAvatar = async (userId: string, avatarUrl: string) => {
  try {
    const response = await userProfileService.uploadAvatar(userId, avatarUrl);
    toast.success(response.message || 'Avatar updated successfully');
    return response;
  } catch (error) {
    handleErrorToast(error, 'Failed to update avatar');
    throw error; // always re-throw
  }
};
```

**Always re-throw.** The component needs the rejection to reset loading state and keep the dialog open.

## Mode 2 — Inline string (real-time async checks)

Name/URL availability while the user types. A toast here is disruptive — the user is mid-keystroke.

```typescript
// handler — returns string[], no toast, no throw
export const handleCheckUserUrl = async (userId: string, url: string) => {
  try {
    return await userProfileService.checkUserUrl(userId, { profileUrlSlug: url });
  } catch (error) {
    return handleErrorMessage(error, 'Failed to check profile URL'); // string[]
  }
};

// hook — stores the first string
setState({
  isChecking: false,
  isAvailable: false,
  error: Array.isArray(result) ? result[0] : 'Failed to check profile URL',
});

// component — renders under the input, field prefix stripped
{!urlValidation.isChecking && urlValidation.error && (
  <p className="text-sm text-amber-500">
    {urlValidation.error.split(': ')[1] || urlValidation.error}
  </p>
)}
```

State type in `types/domain.ts`:

```typescript
type ValidationState = { isChecking: boolean; isAvailable: boolean | null; error: string | null };
```

This is the **only** handler shape that neither toasts nor re-throws.

## Mode 3 — Client-side Zod, no API

Complex dialogs that validate before submit. Errors become `Record<string, string>` and render per field, via a `formatZodErrors(error: ZodError)` helper in `utils/helpers.ts`.

## Mode 4 — React Hook Form

`zodResolver` with the schema VALUE from `@repo/schemas-types`. Field errors render from `formState.errors.<field>.message`. A global form error lives in local state:

```typescript
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

## Auth — documented target, not current code

> **Status check before you rely on this.** `AuthApiError` and `parseSignInError` are described in `frontend-error-handling.instructions.md` but **do not exist anywhere in the repo**. `modules/auth/handlers/sign-in.handlers.ts` today toasts via `handleErrorToast` and re-throws, exactly like every other handler. If a task needs field-level auth errors, the class and the parser have to be built first — do not import them expecting them to resolve.

The intended design: auth is the only place API errors map to specific form fields, so the handler throws `AuthApiError` instead of toasting and the structure survives to the form.

```typescript
catch (error) {
  if (error instanceof AuthApiError) {
    const { fieldErrors, globalMessage } = parseSignInError(error);
    Object.entries(fieldErrors).forEach(([field, message]) => {
      form.setError(field as keyof SignInFormValues, { type: 'manual', message });
    });
    setErrorMessage(globalMessage);
  }
}
```

Auth services use `safeParse` + `firstZodMessage` rather than `wrapZodError`.

## Reads never toast

A failed page load or table fetch renders an inline error state with a retry — never a toast. That is why there is no read handler; the React Query hook exposes `error` and the section renders it.

## Decision guide

| Scenario | Pattern |
|---|---|
| Saving / uploading / deleting | `handleErrorToast` + re-throw in the handler |
| Checking name/URL while the user types | `handleErrorMessage` → hook error state → `<p>` |
| Complex form, many fields | `formatZodErrors` → `Record<string, string>` → per field |
| RHF-managed dialog form | `zodResolver` → `formState.errors.field.message` |
| Auth sign-in / sign-up | Today: `handleErrorToast` + re-throw. Target: `AuthApiError` → `parseSignInError` → `form.setError` (must be built first) |
| Client-side file validation | local validator → local error state |
| Client-side business rule (e.g. max contacts) | `toast.error(...)` directly in the component |
| Read/list failure | inline error state + retry, from the hook's `error` |

## Anti-patterns

```typescript
// ❌ Swallowing — component can never reset loading state
catch (error) {
  handleErrorToast(error, 'Failed');
  // missing: throw error
}

// ❌ Wrapping a re-thrown API error — strips .status, breaks 422 formatting
function wrapZodError(error: unknown): never {
  if (error instanceof ZodError) throw new Error(error.issues[0].message);
  throw new Error((error as Error).message);   // ← must be: throw error;
}

// ❌ Toast for inline async validation — fires while the user is still typing
catch (error) { handleErrorToast(error, 'URL check failed'); }

// ❌ Toast on a read — a page load must not toast
```

Also forbidden: a local `createErrorWithStatus`; a bare `catch {}`; `console.error` as the only handling; `sonner` imported outside `handlers/` (the sole exception being a client-side business rule with no API call).

## Checklist

- [ ] `api/` throws `createApiError(message, status)`
- [ ] Service re-throws non-Zod errors **unchanged**
- [ ] Handler calls `handleErrorToast` **and** `throw error`
- [ ] Inline async checks use `handleErrorMessage`, never a toast
- [ ] Auth: matches whichever pattern is actually in place (today `handleErrorToast` + re-throw), not the unimplemented `AuthApiError` design
- [ ] Reads surface inline error state with a retry, never a toast
- [ ] No swallowed errors, no `sonner` outside `handlers/`
