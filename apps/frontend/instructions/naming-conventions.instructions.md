---
description: "Naming conventions for files, folders, variables, functions, types, and constants in the frontend Next.js/TypeScript codebase."
applyTo: "apps/frontend/**"
---

# Frontend Naming Conventions

## Scope (Frontend Only)

This instruction applies only to the frontend Next.js app under `apps/frontend/**`.

Do not apply these frontend-specific naming rules to:

- `apps/backend/**`
- `apps/admin/**`
- `packages/**`
- non-frontend tooling/docs unless explicitly stated

---

## 1. File Naming

### Data-layer files (inside feature folders)

Use **kebab-case** throughout. Role suffix describes what the file does.

| Pattern | Example | When to use |
|---------|---------|-------------|
| `api-constants.ts` | `api-constants.ts` | Endpoint URL builders — always exactly this name |
| `<domain>-api.ts` | `api-keys-api.ts` | Raw HTTP transport for a domain |
| `<domain>-profile-service.ts` | `user-profile-service.ts` | Profile/setup module service |
| `<domain>-management-service.ts` | `api-keys-management-service.ts` | CRUD/management module service |
| `<domain>-service.ts` | `auth-service.ts` | Single-concern module service |
| `<area>.handlers.ts` | `header.handlers.ts` | Handler group for a UI area |
| `<feature>.handlers.ts` | `api-keys.handlers.ts` | Handler group for a feature/entity |
| `domain.ts` | `domain.ts` | Module types hub — always exactly this name |
| `schemas.ts` | `schemas.ts` | Module validation re-exports — always this name |
| `<entity>.schema.ts` | `user-preferences.schema.ts` | Local Zod schema (list-page pattern) |
| `constants.ts` | `constants.ts` | General module constants |
| `<entity>.constants.ts` | `contact-info.constants.ts` | Entity-specific constants |
| `helpers.ts` | `helpers.ts` | General pure utility functions |
| `<domain>-helpers.ts` | `preferences-helpers.ts` | Domain-specific pure helpers |
| `testids.ts` | `testids.ts` | Test ID constants — always this name |

### Component files (inside `components/`)

Use **PascalCase** for all React component files (`.tsx`).

| Pattern | Example | When to use |
|---------|---------|-------------|
| `<Domain>Page.tsx` | `UserProfilePage.tsx` | Owner/edit page (async Server Component) |
| `<Domain>PageServer.tsx` | `UserProfilePageServer.tsx` | Public read-only page (async Server Component) |
| `<Feature>PageClient.tsx` | `ApiKeysPageClient.tsx` | Private client-side page shell |
| `<Domain><Section>SectionComponent.tsx` | `ProfileHeaderSectionComponent.tsx` | Section implementation |
| `<Name>EditDialog.tsx` | `NameEditDialog.tsx` | Edit dialog for a field/entity |
| `<Name>Dialog.tsx` | `BannerDialog.tsx` | Dialog without a specific action suffix |
| `<Name>DeleteDialog.tsx` | `ApiKeyDeleteDialog.tsx` | Delete confirmation dialog |
| `<Entity>Table.tsx` | `ApiKeyTable.tsx` | Table component for a list page |
| `<Entity>Dialogs.tsx` | `ApiKeyDialogs.tsx` | Dialog host that renders add/edit/delete dialogs |
| `<Entity>LabelInputCell.tsx` | `ApiKeyNameInputCell.tsx` | Inline editable table cell |
| `<Entity>Input.tsx` | `ContactInfoInput.tsx` | Composite input component |
| `<Action>Modal.tsx` | `CreateApiKeyModal.tsx` | Modal for a specific action |
| `<Entity>StatusActions.tsx` | `ApiKeyStatusActions.tsx` | Row-level action button group |
| `<Name>Tab.tsx` | `KeysTab.tsx` | Tab panel component |
| `Add<And>Edit<Entity>.tsx` | `AddAndEditApiKey.tsx` | Combined add+edit dialog form |
| `Presenter.tsx` | `Presenter.tsx` | Read-only row/card presenter (always this name) |
| `<Name>.tsx` | `AutocompleteInput.tsx` | Generic reusable UI primitive |

### Hook files

| Pattern | Example | When to use |
|---------|---------|-------------|
| `use<Feature>.ts` | `useUsernameValidation.ts` | Hook for a domain/feature concern |
| `use<Name>Dialog.ts` | `useNameDialog.ts` | Hook that owns a single dialog's state |
| `use<Subject>.ts` | `useEmailVerification.ts` | Hook for a subject-level concern |
| `hooks.ts` | `hooks.ts` | Multiple hooks in one file (profile modules) |

### Context files

| Pattern | Example |
|---------|---------|
| `<domain>-name-context.tsx` | `user-name-context.tsx` |
| `<feature>-context.tsx` | `auth-context.tsx` |

### Barrel files

Always named `index.ts` (or `index.tsx` for component barrels).

---

## 2. Folder Naming

### Data layers (underscore prefix — always)

All feature sub-folders that represent an architecture layer use a leading underscore.

```
api/
services/
handlers/
hooks/
types/
validations/
_schema/        ← list-page pattern only (local Zod schemas)
constants/
utils/
components/
```

### Component sub-folders (no underscore)

```
components/
├── pages/          ← page orchestrators
├── sections/       ← named section sub-folders (kebab-case)
│   └── <section-name>/   e.g., header/, bio/, contact-info/
├── shared/         ← reusable local UI primitives
├── tabs/           ← tab panel components
├── modals/         ← standalone modals
├── actions/        ← row/entity action button groups
└── tags/           ← tagging-feature components
```

### List-page zone folders (parentheses convention)

Lightweight list-page modules use parentheses to group UI zones visually:

```
components/
├── (header)/       ← page title and primary action button
├── (filter)/       ← search input and filter dropdowns
└── (table)/        ← table, cells, dialog host, table hook
```

### Section sub-folders

Named in **kebab-case** matching the section's display concept:

```
sections/
├── header/
├── bio/
├── contact-info/
├── preferences/
├── info-panel/
├── account-status/
└── avatar/
```

### Route groups (Next.js)

Named in **kebab-case with parentheses** — this is Next.js route group syntax:

```
(user-hybrid)/
(user-management-private)/
(dashboard-shell)/
(public)/
(auth)/
(sign-in)/
(sign-up)/
```

### Feature folder root

Feature folders live directly under `modules/<domain>/<feature-name>/`. No `_resources/` wrapper.

---

## 3. Variable Naming

**Rule: `camelCase` for all variables.**

```typescript
// ✓ Good
const userId = params.userId;
const transformedProfile = await service.getTransformedProfile(id, cookies);
const eligibleApiKeys = apiKeys.filter(...);
const trimmedEmail = email.trim().toLowerCase();

// ✗ Bad
const user_id = ...;       // snake_case
const TransformedProfile;  // PascalCase
const tp = ...;            // abbreviation
const userid = ...;        // no camelCase separation
```

**Arrays must use plural names:**

```typescript
// ✓ Good
const timezones: TimezoneEntryType[] = [];
const eligibleIds: string[] = [];
const duplicateEmails: string[] = [];

// ✗ Bad
const timezone: TimezoneEntryType[] = [];   // singular for array
const eligibleId: string[] = [];            // singular for array
```

**Boolean variables use `is`, `has`, `can`, `should` prefix:**

```typescript
// ✓ Good
const isOwner = await ownershipChecker(cookies, id);
const hasChanges = true;
const isInitialLockCheckPending = false;
const canUpdate = result.canUpdate;
const isUrlLocked = daysSinceLastUpdate !== null && daysSinceLastUpdate < 30;

// ✗ Bad
const owner = true;
const changed = false;
const locked = true;
```

**Avoid abbreviations — use full descriptive names:**

```typescript
// ✓ Good
const apiKeyId = params.apiKeyId;
const requestVersion = requestVersionRef.current;
const debounceMs = 500;

// ✗ Bad
const keyId = ...;
const reqVer = ...;
const ms = 500;
```

---

## 4. Function Naming

**Rule: `camelCase`, starting with a verb that describes the action.**

### Handlers

Pattern: `handle<Action><Entity>` — exported `const` or named `async function`

```typescript
// ✓ Good
export const handleUploadAvatar = async (id: string, payload: ...) => { ... };
export const handleRegenerateApiKey = async (apiKeyId: string, ...) => { ... };
export const handleCreateApiKey = async (name: string, ...) => { ... };
export const handleCheckUsername = async (id: string, ...) => { ... };
export const handleRevokeApiKey = async (apiKeyId: string) => { ... };
export async function handleSignIn(email: string, password: string) { ... }

// ✗ Bad
export const uploadAvatar = ...;               // no "handle" prefix
export const apiKeyRegenerate = ...;           // not verb-first
export const processApiKeys = ...;             // vague verb "process"
export const revokeApiKeyHandler = ...;        // "Handler" suffix on a handler
```

### Service functions

Pattern: `<verb><Entity>` — standalone `export async function`

```typescript
// ✓ Good
export async function regenerateApiKey(apiKeyId: string, ...) { ... }
export async function createApiKey(name: string, ...) { ... }
export async function getTransformedProfile(id: string, cookies?: string) { ... }
export async function syncTimezones(current: ..., next: ...) { ... }
export async function checkOwnership(cookies: string, id: string) { ... }
export async function revokeSession(sessionId: string) { ... }

// ✗ Bad
export async function apiKeyRegenerate(...) { ... }       // not verb-first
export async function handleApiKey(...) { ... }           // "handle" belongs in handlers
export async function processApiKey(...) { ... }          // vague verb
```

### API service functions

Pattern: same verb-first name — one `export async function` per HTTP call

```typescript
// ✓ Good
export async function getApiKeys(): Promise<ApiKey[]> { ... }
export async function revokeApiKey(request: RevokeApiKeyRequest): Promise<ApiKey> { ... }
export async function signIn(email: string, password: string): Promise<AuthApiResponse> { ... }
export async function getProfile(id: string, cookies?: string): Promise<GetProfileApiResponse> { ... }

// ✗ Bad
export async function fetchApiKeyList() { ... }    // "List" is redundant; inconsistent verb
export async function doSignIn() { ... }           // vague verb "do"
```

### Hooks

Pattern: `use<Feature>` — exported named function

```typescript
// ✓ Good
export function useUsernameUrlValidation(options: UrlValidationOptions) { ... }
export function useUsernameValidation(options: NameValidationOptions) { ... }
export function useEmailVerification(userId: string) { ... }
export function useNameDialog(props: ...) { ... }
export function useBannerDialog(props: ...) { ... }
export function useApiKeyTable(apiKeys: ...) { ... }

// ✗ Bad
export function UsernameValidation() { ... }   // PascalCase — looks like a component
export function usernameValidation() { ... }   // no "use" prefix
export function getUrlValidation() { ... }     // wrong verb for a hook
```

### Utility / helper functions

Pattern: `<verb><Noun>` — named functions or arrow function exports

```typescript
// ✓ Good
export function capitalizeFirst(str: string): string { ... }
export function buildNameUpdatePayload(values: ..., initial: ...): UpdateNamePayload { ... }
export const slugSanitize = (value: string): string => ...;
export function formatUsername(raw: string): string { ... }
export function extractUserIdFromUrl(url: string): string { ... }
export function cloneFormValues<T>(values: T): T { ... }

// ✗ Bad
export function namePayload() { ... }      // not verb-first
export function helperFn() { ... }         // meaningless name
export const Capitalize = () => ...;       // PascalCase on a utility
```

**Approved verbs by use case:**

| Use case | Approved verbs |
|---------|----------------|
| Fetching data | `get`, `fetch`, `load`, `list` |
| Writing data | `create`, `update`, `delete`, `remove`, `save`, `sync`, `revoke` |
| Transforming data | `transform`, `map`, `format`, `parse`, `normalize`, `build`, `extract` |
| Validation / checks | `validate`, `check`, `verify`, `assert`, `isValid` |
| UI events | `handle` (handlers only), `reset`, `toggle`, `open`, `close` |
| Sanitization | `sanitize`, `trim`, `slug` |

> ❌ Avoid: `process`, `manage`, `do`, `execute`, `perform`

---

## 5. Constant Naming

**Rule: `SCREAMING_SNAKE_CASE` for all module-level constants.**

### Endpoint objects

```typescript
// ✓ Good
export const AUTH_ENDPOINTS = {
  SIGN_IN: '/auth/v1/sign-in',
  SIGN_UP: '/auth/v1/sign-up',
} as const;

export const API_KEY_ENDPOINTS = {
  GET_ALL: `${API_BASES.USER_MANAGEMENT}/api-keys`,
  GET_ONE: (apiKeyId: string) => `${API_BASES.USER_MANAGEMENT}/api-keys/${apiKeyId}`,
  REVOKE: (apiKeyId: string) => `${API_BASES.USER_MANAGEMENT}/api-keys/${apiKeyId}/revoke`,
} as const;

export const USER_PROFILE_ENDPOINTS = {
  GET_PROFILE: (id: string) => `${BASE}/users/${id}/profile`,
} as const;
```

Convention: `<DOMAIN>_ENDPOINTS` for a domain group, `<ENTITY>_ENDPOINTS` for a specific entity group.

### Test ID objects

```typescript
// ✓ Good
export const KEY_HEADER = {
  ADD_BUTTON: 'key-header-add-button',
} as const;

export const KEY_FILTER = {
  SEARCH_INPUT: 'key-filter-search-input',
  STATUS_TRIGGER: 'key-filter-status-trigger',
} as const;

export const KEY_TABLE = {
  REVOKE_LINK_PREFIX: 'key-revoke-link-',
} as const;

export const PROFILE_HEADER = {
  EDIT_PHOTO_BUTTON: 'profile-header-edit-photo-button',
} as const;
```

Convention: `<ENTITY>_<ZONE>` — entity is abbreviated (e.g., `KEY`), zone matches the UI area (`HEADER`, `FILTER`, `TABLE`). Test ID string values use `kebab-case`.

### Status and option arrays

```typescript
// ✓ Good
export const API_KEY_STATUSES_DATA = [
  'active', 'revoked', 'expired',
] as const;
```

Convention: `<ENTITY>_<CATEGORY>_DATA` for data arrays, `<ENTITY>_STATUSES` for status enumerations.

### UI limit objects

```typescript
// ✓ Good
export const UI_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_MEDIA_ITEMS: 10,
  BIO_TIP_THRESHOLD: 500,
} as const;
```

### Scalar constants

```typescript
// ✓ Good
export const MAX_API_KEY_NAME_LENGTH = 50;
export const MAX_ACTIVE_SESSIONS = 5;
export const VERIFICATION_COOLDOWN_SECONDS = 60;
export const MAX_API_KEYS_PER_USER = 10;

// ✗ Bad
export const maxApiKeyName = 50;          // camelCase for module-level constant
export const max_api_key_name_length = 50; // snake_case
```

**Local constants inside a function** that are not truly fixed config may use `camelCase`:

```typescript
const now = new Date();           // ✓ local temporal value
const trimmed = email.trim();     // ✓ local derived value
const requestVersion = ref.current; // ✓ local snapshot
```

---

## 6. Type & Interface Naming

**Rule: `PascalCase` for all types, interfaces, and type aliases.**

### Domain entity types

```typescript
// ✓ Good
export interface ApiKey { id: string; name: string; status: ApiKeyStatus; }
export interface Session { id: string; device: string; status: SessionStatus; }
export interface UserPreference { id: string; key: string; value: string; }

// Type aliases for union statuses
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';
export type SessionStatus = 'active' | 'expired' | 'revoked';
```

Convention: Entity interfaces are **PascalCase nouns** (`ApiKey`, not `ApiKeyData` or `IApiKey`). Status union types are `<Entity>Status`.

### Form value types

```typescript
// ✓ Good
export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;
export type { BioFormValues, NameFormValues, PreferencesFormValues } from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';
```

Convention: `<Entity>FormValues` — inferred from the Zod schema in `@repo/schemas-types`.

### Payload types (import at call site — no alias)

These live in `@repo/schemas-types`. Import directly at the call site using the canonical exported name — never alias with `as`:

```typescript
// ✓ Good — import at call site, canonical name, no alias
import type {
  UserUpdateNamePayloadType,
  UserCreateTimezonesPayloadType,
} from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';

// ✗ Bad — aliasing @repo/schemas-types imports is forbidden
import type {
  UserUpdateNamePayloadType as UpdateNamePayloadType,
} from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';
```

Convention: `<Domain><Action><Entity>PayloadType` — the full canonical name as exported from `@repo/schemas-types`. Never shorten or rename at the import site.

### API request types (locally defined)

```typescript
// ✓ Good
export interface RevokeApiKeyRequest { apiKeyId: string; reason?: string; }
export interface CreateApiKeyRequest { name: string; }
export interface RevokeSessionRequest { sessionId: string; message?: string; }
```

Convention: `<Action><Entity>Request`.

### API response types (from `@repo/schemas-types` or locally)

```typescript
// ✓ Good — from @repo/schemas-types
import type { UserProfileResponseType } from '@repo/schemas-types/payload-schemas/user-management/profile/response.schema';

// Local only when no package type covers this shape
export interface CreateApiKeyResponse { success: boolean; count: number; }
```

Convention: `<Action><Entity>Response` or `Get<Entity>ApiResponse`.

### Hook option types and result types

```typescript
// ✓ Good
interface UrlValidationOptions { id: string; currentUrl?: string; debounceMs?: number; }
interface NameValidationOptions { userId: string; currentName?: string; }
interface UrlValidationState { isChecking: boolean; isAvailable: boolean | null; isLocked: boolean; }
```

Convention: `<Feature>Options` for hook parameters, `<Feature>State` for state shape interfaces.

### Composite DTOs (local to the module)

```typescript
// ✓ Good — defined in types/domain.ts
export interface TransformedProfileData { header: UserProfileHeaderDataType; timezones: TimezoneEntryType[]; ... }
export interface UrlCheckResult { canUpdate: boolean; isUniqueUrl: boolean; isLocked: boolean; ... }
```

Convention: `<Adjective><Entity>Data` or `<Entity><Noun>`.

> Avoid the `I` prefix on interfaces (`IApiKey` ❌). Use plain `PascalCase`.
> Avoid the `T` prefix on types (`TStatus` ❌). Use plain `PascalCase`.

---

## 7. Component Naming

### Page components

```typescript
// ✓ Good
const UserProfilePage = async ({ userId, cookies }: ...) => { ... };
const UserProfilePageServer = async ({ userId }: ...) => { ... };
const ApiKeysPageClient = () => { ... };

export default UserProfilePage;
```

### Section components

```typescript
// ✓ Good — section entry (re-exports or thin wrapper)
const ProfileHeaderSection = (props: ProfileHeaderSectionProps) => { ... };

// ✓ Good — section implementation
const ProfileHeaderSectionComponent = (props: ...) => { ... };
```

### Dialog components

```typescript
// ✓ Good
const NameEditDialog = ({ open, onOpenChange, initialValues, onSave }: ...) => { ... };
const ApiKeyDeleteDialog = ({ open, onConfirm, onCancel }: ...) => { ... };
const BannerDialog = ({ ... }) => { ... };
const CreateApiKeyModal = ({ ... }) => { ... };
```

### Reusable shared components

```typescript
// ✓ Good
const AutocompleteInput = ({ onSearch, onSelect, ... }: ...) => { ... };
const BaseDialog = ({ open, onOpenChange, title, children }: ...) => { ... };
const FormFieldError = ({ message }: ...) => { ... };
const PreferenceGroupInput = ({ preferences, onChange }: ...) => { ... };
```

---

## 8. Hook Naming (inside hooks)

### Returned values from hooks

Follow the same rules as variable naming — `camelCase`, booleans prefixed:

```typescript
// ✓ Good
const { isChecking, isAvailable, isLocked, validateUrl, checkLock, resetValidation } =
  useUsernameUrlValidation(options);

const { emailVerified, showCodeInput, resendCooldown, handleVerifyEmail, autoVerifyIfNeeded } =
  useEmailVerification(userId);
```

### Internal state and refs

```typescript
// ✓ Good
const [state, setState] = useState<UrlValidationState>(INITIAL_STATE);
const timeoutRef = useRef<NodeJS.Timeout | null>(null);
const lastCheckedRef = useRef<{ value: string; state: UrlValidationState } | null>(null);
const requestVersionRef = useRef(0);
```

Convention: Refs always end with `Ref`. Initial state constants are `INITIAL_<STATE_NAME>` in SCREAMING_SNAKE_CASE.

---

## 9. React Hook Form Patterns

```typescript
// ✓ Good — form instance
const form = useForm<ApiKeyFormValues>({
  resolver: zodResolver(apiKeyFormSchema),
});

// ✓ Good — watched values
const hasApiKeyDescription = form.watch('hasApiKeyDescription');
const watchedExpiresAt = form.watch('expiresAt');

// ✓ Good — form state destructuring
const { isSubmitting, errors } = form.formState;
```

Convention: The form instance is always named `form`. Watched values use `watched<FieldName>` for non-boolean fields and `has<FieldName>` / `is<FieldName>` for boolean fields.

---

## 10. `as const` Usage

Use `as const` on:
- All endpoint objects (`API_KEY_ENDPOINTS`, `AUTH_ENDPOINTS`)
- All test ID objects (`KEY_HEADER`, `PROFILE_HEADER`)
- All status/option arrays used for type inference
- Any object whose values are used as literal types

```typescript
// ✓ Good
export const AUTH_ENDPOINTS = { SIGN_IN: '/auth/v1/sign-in' } as const;
export const KEY_HEADER = { ADD_BUTTON: 'key-header-add-button' } as const;
export const API_KEY_STATUSES_DATA = ['active', 'revoked'] as const;
```

---

## 11. Import Alias for Service Namespace

When a handler or hook imports a service module, always use a **namespace import alias**:

```typescript
// ✓ Good — always in handlers and hooks that call the service
import * as userProfileService from '../services';
import * as apiKeysManagementService from '../services';
import * as authService from '../services';

// Usage stays the same at every call site:
await userProfileService.updateName(id, payload);
await apiKeysManagementService.createApiKey(name, ...);
```

Convention: Alias name = `<domain>ProfileService` (profile modules) or `<domain>ManagementService` (CRUD modules) or `<domain>Service` (other modules). Never use a default import from the barrel.

---

## 12. Next.js `dynamic()` Import Naming

When lazy-loading a dialog or modal, the import variable uses the same PascalCase component name:

```typescript
// ✓ Good
const NameEditDialog = dynamic(() => import('./NameEditDialog'));
const BannerDialog = dynamic(() => import('../sections/header/BannerDialog'));
const CreateApiKeyModal = dynamic(() => import('../modals/CreateApiKeyModal'));
```

---

## Quick Reference Cheat Sheet

| Thing | Convention | Example |
|-------|-----------|---------|
| Data-layer file | `<domain>-<role>.ts` kebab-case | `api-keys-api.ts`, `profile-api.ts` |
| Handler file | `<area>.handlers.ts` | `header.handlers.ts` |
| Hook file | `use<Feature>.ts` | `useUsernameValidation.ts` |
| Component file | `PascalCase.tsx` | `NameEditDialog.tsx` |
| Context file | `<domain>-context.tsx` | `user-name-context.tsx` |
| Schema file (list) | `<entity>.schema.ts` | `user-preferences.schema.ts` |
| Layer folder | `_<layer>/` | `handlers/`, `services/` |
| Section folder | `<name>/` kebab-case | `header/`, `contact-info/` |
| List-page zone | `(<zone>)/` parentheses | `(table)/`, `(filter)/` |
| Variable | `camelCase` | `transformedProfile` |
| Boolean variable | `is/has/can/should` prefix | `isUrlLocked` |
| Array variable | plural | `eligibleIds` |
| Handler export | `handle<Action><Entity>` | `handleUploadAvatar` |
| Service function | verb-first camelCase | `syncTimezones` |
| API function | same as service | `getApiKeys` |
| Hook export | `use<Feature>` | `useUsernameUrlValidation` |
| Utility function | verb-first camelCase | `buildNameUpdatePayload` |
| Module-level constant | `SCREAMING_SNAKE_CASE` | `KEY_HEADER`, `API_KEY_ENDPOINTS` |
| Endpoint object | `<DOMAIN>_ENDPOINTS` | `AUTH_ENDPOINTS` |
| Test ID object | `<ENTITY>_<ZONE>` | `KEY_TABLE` |
| Test ID value | `kebab-case` string | `'key-header-add-button'` |
| Type / Interface | `PascalCase` | `TransformedProfileData` |
| Form values type | `<Entity>FormValues` | `ApiKeyFormValues` |
| Payload type (canonical) | `<Domain><Action><Entity>PayloadType` | `UserUpdateNamePayloadType` — no alias on import |
| Request type | `<Action><Entity>Request` | `RevokeApiKeyRequest` |
| Response type | `<Action><Entity>Response` | `CreateApiKeyResponse` |
| Status union type | `<Entity>Status` | `ApiKeyStatus` |
| Hook options type | `<Feature>Options` | `UrlValidationOptions` |
| Hook state type | `<Feature>State` | `UrlValidationState` |
| Service import alias | `* as <domain>Service` | `* as apiKeysManagementService` |
| Form instance | `form` | `const form = useForm(...)` |
| Watched boolean field | `is<Field>` / `has<Field>` | `hasApiKeyDescription` |
| Watched value field | `watched<Field>` | `watchedExpiresAt` |
| Ref variable | `<name>Ref` | `requestVersionRef`, `timeoutRef` |
| Initial state constant | `INITIAL_<STATE_NAME>` | `INITIAL_URL_VALIDATION_STATE` |
