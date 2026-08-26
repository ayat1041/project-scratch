---
description: "Error handling patterns for the frontend: API layer status errors, service layer Zod validation, handler layer toasts, inline string error state, and component-level form errors."
applyTo: "apps/frontend/**"
---

# Frontend Error Handling Architecture

## 🗺️ Layer Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMPONENT  (components/)                                          │
│  Renders errors: toast / <p> under input / formState.errors         │
├─────────────────────────────────────────────────────────────────────┤
│  HOOK  (hooks/)                 [only for inline async checks]      │
│  Stores { isChecking, isAvailable, error: string | null } in state  │
├─────────────────────────────────────────────────────────────────────┤
│  HANDLER  (handlers/)                                              │
│  ┌── Toast path: handleErrorToast(error, fallback) + throw error    │
│  └── Inline path: handleErrorMessage(error, fallback) → string[]   │
├─────────────────────────────────────────────────────────────────────┤
│  SERVICE  (services/)                                              │
│  Zod validates input, calls API, normalises ZodError via            │
│  wrapZodError — re-throws API errors unchanged                      │
├─────────────────────────────────────────────────────────────────────┤
│  API  (api/)                                                       │
│  Returns ApiResponse<T>. On failure:                                │
│  throws createApiError(message, status)  ← @repo/utilities          │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 User Story — How an error travels the stack

**User clicks "Save"** on a profile section:

```
Component
  └─ calls handler (handleUpdateBio)
       └─ calls service (profileService.updateBio)
            └─ Zod validates payload
            └─ calls API function (userProfileApiService.updateBio)
                 └─ fetchWithCookies → response.json() as ApiResponse<null>
                 └─ !response.ok || !data.success
                      └─ throw createApiError(msg, 422)  ← @repo/utilities
                 ↑ error propagates (carries .status = 422)
            └─ wrapZodError: not a ZodError → re-throws unchanged
            ↑ error propagates (still carries .status = 422)
       └─ handler catch:
            handleErrorToast(error, 'Failed to update bio')
              → reads error.status === 422
              → parseValidationErrors(message) → ["msg1", "msg2"]
              → toast.error(<bullet list>)
            throw error  ← component resets loading state
```

**User types in the Username field** (real-time check while typing):

```
Component (NameDialog)
  └─ input onChange → hook (useUsernameUrlValidation)
       └─ debounce → calls handler (handleCheckUsername)
            └─ calls service → API function
                 └─ fetch → error (e.g. 422)
                      └─ throw createErrorWithStatus(msg, 422)
                 ↑ error propagates
            └─ handler catch:
                 handleErrorMessage(error, 'Failed to check username')
                   → returns string[]   ← NO toast shown
            ← handler returns string[]
       └─ hook stores: error = result[0]   (string | null in state)
  └─ renders: <p className="text-amber-500">{urlValidation.error}</p>
```

## Two Display Modes

The frontend has **two distinct error display modes**:

| Mode | When to use | How it looks |
|---|---|---|
| **Toast** | Fire-and-forget operations (save, upload, delete) | Floating notification from Sonner |
| **Inline string** | Real-time async checks (URL/name availability as the user types) | Text under the input field |

Both modes share the same API and service layers. The split happens at the **handler layer** — `handleErrorToast` vs `handleErrorMessage`.

---

## Layer 1 — API Layer (`api/`)

Every API function returns `Promise<ApiResponse<T>>` — the canonical discriminated union from `@repo/schemas-types/payload-schemas/common/api-types.schema`. On failure, throw using `createApiError` from `@repo/utilities/errors/error-parsing`. This attaches `.status`/`.statusCode` to the thrown error so `handleErrorToast` can format 422 errors as bullet lists.

```typescript
import { createApiError } from '@repo/utilities/errors/error-parsing';
import type { ApiResponse } from '@repo/schemas-types/payload-schemas/common/api-types.schema';
```

### Standard mutation pattern

```typescript
export async function updateName(id: string, payload: UpdateNamePayload): Promise<ApiResponse<null>> {
  const response = await fetchWithCookies(ENDPOINTS.UPDATE_NAME(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as ApiResponse<null>;
  if (!response.ok || !data.success) {
    throw createApiError(data.message || 'Failed to update name', response.status);
  }
  return data;
}
```

- Check both `!response.ok` AND `!data.success` — the discriminated union enforces that `.data` is only accessible after narrowing
- `createApiError(message, status)` creates an `Error` with `.status` and `.statusCode` set — never wrap in bare `new Error(msg)` which strips the status
- `ApiResponse<null>` for mutations that return no payload (success/error signal only)

### Read endpoints (SSR — return null on failure)

```typescript
export async function getProfile(id: string, cookies?: string): Promise<ApiResponse<ProfileData> | null> {
  const response = await fetchWithCookiesServer(ENDPOINTS.PROFILE(id), cookies);
  if (!response.ok) return null;
  return response.json() as Promise<ApiResponse<ProfileData>>;
}
```

Return `| null` for SSR reads where "not found" is a valid state (page renders `not-found.tsx`). Services then narrow with `if (!result || !result.success)`.

### Special case: status as a value, not an error

Some endpoints use the HTTP status to communicate outcome rather than failure. Parse regardless:

```typescript
// URL availability — 200 = available, 409 = taken
const response = await fetchWithCookies(url, options);
const data = await response.json() as ApiResponse<{ isUniqueUrl: boolean }>;
// Don't throw — return data for the service to interpret
return data;
```

---

## Layer 2 — Service Layer (`services/`)

Services validate payloads with Zod before the API call, and normalize ZodErrors on the way out.

### Pattern A: `wrapZodError` (most write operations)

```typescript
import { ZodError } from 'zod';

function wrapZodError(error: unknown): never {
  if (error instanceof ZodError) {
    throw new Error(error.issues[0]?.message ?? 'Validation failed');
  }
  throw error; // re-throw unchanged — preserves .status/.statusCode from API layer
}

export async function updateBio(id: string, payload: unknown) {
  try {
    const validated = bioSchema.parse(payload);
    return await userProfileApiService.updateBio(id, validated);
  } catch (error) {
    wrapZodError(error);
  }
}
```

**Why re-throw unchanged for non-ZodErrors:** wrapping an API error in `new Error(message)` strips `.status`/`.statusCode`, breaking `handleErrorToast`'s 422 branching.

### Pattern B: `safeParse` + `firstZodMessage` (auth service)

```typescript
function firstZodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? 'Validation failed';
}

export async function signIn(email: string, password: string) {
  const validated = signinSchema.safeParse({ email, password });
  if (!validated.success) {
    throw new Error(firstZodMessage(validated.error));
  }
  return authApiService.signIn(validated.data);
}
```

Use `safeParse` when the caller needs the error as a global form message, not a toast.

---

## Mode 1 — Toast Errors

Used for save, upload, delete, and other fire-and-forget mutations.

### Handler pattern

```typescript
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import { toast } from 'sonner';

export const handleUploadAvatar = async (userId: string, avatarUrl: string) => {
  try {
    const response = await userProfileService.uploadAvatar(userId, avatarUrl);
    toast.success(response.message || 'Avatar updated successfully');
    return response;
  } catch (error) {
    handleErrorToast(error, 'Failed to update avatar');
    throw error; // always re-throw — component needs to know it failed
  }
};
```

**Always re-throw.** The component calling the handler must know the operation failed to reset loading state or prevent dialog close.

### What `handleErrorToast` does internally

```
error.status === 422
  → parseValidationErrors(message) → ["msg1", "msg2"]  (splits "(-)"-separated list, strips field prefixes)
  → toast.error(<bullet list>)

error.status !== 422
  → toast.error(error.message || fallback)
```

### Contact-info handlers — inline ZodError handling

The `contact-info.handlers.ts` catches `ZodError` directly before calling `handleErrorToast`. This is an older pattern; the standard approach is `wrapZodError` in the service:

```typescript
// In contact-info.handlers.ts
catch (error) {
  if (error instanceof ZodError) {
    const firstError = error.issues[0];
    toast.error(firstError.message);
    throw new Error(firstError.message);
  }
  const errorMessage = error instanceof Error ? error.message : 'Failed to create contact';
  toast.error(errorMessage);
  throw error;
}
```

---

## Mode 2 — Inline String Errors

Used for real-time async validation while the user types (username uniqueness, URL availability). Errors are displayed as text under the input, not as toasts.

### The full chain: handler → hook → component

**Step 1 — Handler returns `string[]` instead of showing a toast**

```typescript
// header.handlers.ts
export const handleCheckUsername = async (
  userId: string,
  userName: string,
) => {
  try {
    return await userProfileService.checkUsername(userId, { userName });
  } catch (error) {
    const errors = handleErrorMessage(error, 'Failed to check username');
    return errors; // string[] — no toast shown
  }
};
```

`handleErrorMessage` has identical parsing logic to `handleErrorToast` but returns `string[]` instead of calling `toast.error`.

**Step 2 — Hook stores the first error string in state**

```typescript
// useUsernameValidation.ts
const response = await handleCheckUsername(userId, normalizedUsername);

// response is either a success shape or string[]
if ('success' in result && result.success) {
  setState({ isChecking: false, isAvailable: result.data.isUnique, error: null, ... });
} else {
  setState({
    isChecking: false,
    isAvailable: false,
    error: Array.isArray(result) ? result[0] : 'Failed to check username',
  });
}
```

The hook's `error` field is `string | null`.

**Step 3 — Component renders the error string under the input**

```tsx
// NameDialog.tsx
{!urlValidation.isChecking && shouldShowUrlValidation && urlValidation.error && (
  <p className="text-sm text-amber-500">
    {urlValidation.error.split(': ')[1] || urlValidation.error}
  </p>
)}
```

The `.split(': ')[1]` strips the field prefix (e.g. `"userName: must be..."` → `"must be..."`).

### `ValidationState` type

```typescript
// domain.ts
type ValidationState = {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | null;
};

type UrlValidationState = ValidationState & {
  daysSinceLastUpdate?: number | null;
};
```

---

## Mode 3 — Client-Side Zod Validation Errors (Inline, No API)

Used for dialogs with complex forms (preferences, contact forms) where client-side Zod validation runs before submit. Errors are stored as `Record<string, string>` and rendered per-field.

### Pattern

```typescript
// helpers.ts
const formatZodErrors = (error: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  error.issues.forEach(issue => {
    errors[issue.path.join('.')] = issue.message;
  });
  return errors;
};

export const validatePreferences = (data: unknown): ValidationResult => {
  try {
    preferencesSchema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, errors: formatZodErrors(error) };
    return { success: false, errors: { general: 'Validation failed' } };
  }
};
```

```typescript
// Component (PreferencesSectionComponent.tsx)
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

const handleSavePreferences = async () => {
  const validation = validatePreferences(preferencesToValidate);
  if (!validation.success) {
    setValidationErrors(validation.errors);
    return; // block save
  }
  setValidationErrors({});
  // proceed with save...
};
```

```tsx
// PreferencesDialog.tsx
{validationErrors.timezone && (
  <p className="text-sm text-destructive">{validationErrors.timezone}</p>
)}
{validationErrors.language && (
  <p className="text-sm text-destructive">{validationErrors.language}</p>
)}
```

`getFieldError(errors, fieldName)` is a helper that reads `errors[fieldName]` to make access slightly cleaner in JSX.

---

## Mode 4 — RHF Form Errors

Used in dialogs that use React Hook Form with a Zod resolver. Errors come from RHF's `formState.errors`.

```tsx
// LegalNameDialog.tsx
const { register, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(schema),
});

// In JSX:
{errors.legalName?.message && (
  <p className="text-sm text-destructive">*{errors.legalName.message}</p>
)}
```

`formState.errors` are set automatically by the Zod resolver on submit. For server-side field errors, use `form.setError`:

```typescript
form.setError('email', { type: 'manual', message: 'Email already exists' });
```

---

## Auth-Specific Error Handling

Auth is the only place where API errors are mapped to specific form fields.

### `AuthApiError` class

```typescript
// domain.ts
export class AuthApiError extends Error {
  constructor(message: string, public readonly response: AuthApiResponse) {
    super(message);
    this.name = 'AuthApiError';
  }
}
```

### Sign-in flow

```typescript
// sign-in.handlers.ts — does NOT call handleErrorToast
// Throws AuthApiError so the component can extract field errors

// SignInForm.tsx
const [errorMessage, setErrorMessage] = useState<string | null>(null);

catch (error) {
  if (error instanceof AuthApiError) {
    const { fieldErrors, globalMessage } = parseSignInError(error);
    Object.entries(fieldErrors).forEach(([field, message]) => {
      form.setError(field as keyof SignInFormValues, { type: 'manual', message });
    });
    setErrorMessage(globalMessage); // shown as global error below form
  }
}
```

`parseSignInError` extracts `fieldErrors: Record<string, string>` and `globalMessage: string | null` from the `AuthApiError` response body.

---

## `@repo/utilities` Error Utilities Reference

### `error-handling.ts` (no UI, pure)

```typescript
// Creates an Error with .status and .statusCode set — use in _api/ layer on failure
createApiError(message: string, status: number): Error & { status: number; statusCode: number }

// Splits "field: message(-)field2: message2" → ["message", "message2"]
parseValidationErrors(message: string): string[]

// Reads .status ?? .statusCode ?? null
getErrorStatus(error: unknown): number | null

// Reads .message, falls back to provided string
getErrorMessage(error: unknown, fallback: string): string
```

### `error-handlers.tsx` (UI, uses Sonner)

```typescript
// 422 → bullet list toast. Other → single toast.
handleErrorToast(error: unknown, fallbackMessage: string): void

// Same parsing as handleErrorToast, returns string[] instead of showing toast.
handleErrorMessage(error: unknown, fallbackMessage: string): string[]
```

---

## Client-Side File Validation

File errors are validated synchronously (or with async image dimension checks) and stored in local state, displayed inline in dialogs:

```typescript
// helpers.ts
export const validateBannerImage = (file: File): Promise<string | null> => {
  return new Promise(resolve => {
    if (file.size > MAX_FILE_SIZE) { resolve('*File size must be less than 5 MB.'); return; }
    if (!IMAGE_TYPES_FILE.includes(file.type)) { resolve('*Invalid file type.'); return; }
    // async dimension check...
  });
};
```

```typescript
// Component
const [fileError, setFileError] = useState<string | null>(null);

const handleFileSelect = async (file: File) => {
  const error = await validateBannerImage(file);
  if (error) { setFileError(error); return; }
  setFileError(null);
  // proceed with upload...
};
```

---

## Complete Error Flow Diagrams

### Toast flow (save/upload/delete)

```
Component → handler → service → API
                                 ↓ !response.ok || !data.success
                         createApiError(msg, status)  ← @repo/utilities
                                 ↓
                        service wrapZodError (re-throws unchanged)
                                 ↓
                handler catch:
                  handleErrorToast(error, fallback)  → toast
                  throw error                        → component resets state
```

### Inline string flow (real-time availability check)

```
User types in input
  → debounced hook callback
    → handleCheckUsername (handler)
      → service → API
                   ↓ error
          handleErrorMessage(error, fallback) → string[]
      ← handler returns string[]
    hook stores error: string[] [0] in state
  component renders <p>{urlValidation.error}</p> under input
```

### Auth sign-in flow

```
Form submit
  → handleSignIn (handler)
    → authService.signIn
      → authApiService.signIn
                            ↓ !response.ok
                  throw AuthApiError(message, responseBody)
    ← error propagates
  handler re-throws AuthApiError
← component catch:
    parseSignInError(error) → { fieldErrors, globalMessage }
    form.setError(field, ...)  → shown under each field
    setErrorMessage(global)    → shown below form
```

---

## Decision Guide — Which pattern to use?

| Scenario | Pattern |
|---|---|
| Saving / uploading / deleting | `handleErrorToast` + re-throw in handler |
| Checking name/URL while user types | `handleErrorMessage` → hook error state → render `<p>` |
| Complex form with many fields (preferences, contact) | `validatePreferences()` → `Record<string, string>` → render per field |
| RHF-managed dialog form | Zod resolver → `formState.errors.field.message` |
| Auth sign-in / sign-up | `AuthApiError` → `parseSignInError` → `form.setError` + `errorMessage` state |
| Client-side file validation | `validateBannerImage` / `validateProfilePhoto` → local error state |
| Client-side business rule (max contacts) | `toast.error(...)` directly in component |

---

## Anti-patterns

```typescript
// ❌ Swallowing the error — component can't reset loading state
catch (error) {
  handleErrorToast(error, 'Failed');
  // missing: throw error
}

// ❌ Wrapping re-thrown API errors — strips .status
function wrapZodError(error: unknown): never {
  if (error instanceof ZodError) throw new Error(...);
  throw new Error((error as Error).message); // strips .status/.statusCode
}

// ❌ Using handleErrorToast in auth handler — swallows AuthApiError structure
catch (error) {
  handleErrorToast(error, 'Sign in failed'); // field errors never reach the form
}

// ❌ Using toast for inline async validation — disruptive while user is still typing
catch (error) {
  handleErrorToast(error, 'URL check failed'); // should use handleErrorMessage instead
}
```
