# Frontend Architecture Guide

> **Scope:** `apps/frontend`  
> Single reference for building any new feature module. Follow it exactly when creating a new module.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Monorepo Shared Package Ecosystem](#2-monorepo-shared-package-ecosystem)
3. [App-Level (Global) Layer](#3-app-level-global-layer)
4. [Module Structure](#4-module-structure)
5. [Layer Reference — All Layers](#5-layer-reference--all-layers)
6. [Component Sub-Patterns](#6-component-sub-patterns)
7. [Dependency Rules](#7-dependency-rules)
8. [Data Flow Templates](#8-data-flow-templates)
9. [Route Access Patterns](#9-route-access-patterns)
10. [Creation Checklist](#10-creation-checklist)
11. [Anti-Patterns](#11-anti-patterns)

---

## 1. Overview

Every module is a self-contained vertical slice under `modules/<domain>/<feature-name>/`. It owns its own types, data fetching, business logic, UI components, and tests. Features never import from each other's internal layers — shared code lives in `modules/<domain>/components/` (domain-shared) or `packages/` (cross-stack).

The `app/` directory contains **only** layouts and `page.tsx` route entry points. All feature code lives in `modules/`. Pages import feature code via the `@modules/*` alias.

```
apps/frontend/
├── app/            ← Routing only: layouts + page.tsx
└── modules/        ← All feature implementations
    ├── auth/
    ├── user-management/
    │   ├── profile/
    │   ├── api-keys/
    │   └── user-preferences/
    └── common/                 ← Shared portal components, constants, and types
```

Today only `modules/auth/` and `modules/common/` are implemented — `user-management/` doesn't exist yet. Every worked example below uses it (specifically a hypothetical `api-keys` feature) as the reference shape for the **next** module you build; the layer/dependency rules apply identically to any domain.

**Import alias:** `@modules/*` → `./modules/*` (configured in `tsconfig.json`). Use it for all page→feature and cross-feature imports.

---

## 2. Monorepo Shared Package Ecosystem

These packages are the **single source of truth** for all cross-boundary contracts. No module defines its own versions.

| Package               | What it owns                                                                                | Import from                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@repo/schemas-types` | Zod request schemas + inferred payload types; TypeScript response types; entity table types | `@repo/schemas-types/payload-schemas/<domain>/<feature>/payload.schema` |
| `@repo/constants`     | Shared runtime enums, status values, option arrays                                          | `@repo/constants`                                                       |
| `@repo/ui`            | Shared React component library                                                              | `@repo/ui/components/...`                                               |
| `@repo/utilities`     | Pure utilities, error handlers, fetch helpers                                               | `@repo/utilities/errors/error-toasts`                                        |

**Rule:** If a type, schema, or constant is used by both the frontend and backend, it lives in `packages/`. Never define it twice.

Local form schemas live in `validations/schemas.ts` (or `validations/<entity>.schema.ts` for entity-specific forms) when they are pure UI concerns with no backend dependency.

---

## 3. App-Level (Global) Layer

These live at `apps/frontend/` root and are used by all features.

```
apps/frontend/
├── shared/
│   ├── api/
│   │   └── session-service.ts        — App-wide session/cookie helpers
│   ├── common/
│   │   ├── form/
│   │   │   └── SuggestionField.tsx   — Generic async suggestion combobox
│   │   └── input/
│   │       └── FieldInput.tsx, FieldSelect.tsx, ...
│   └── types/
├── context/
│   ├── auth-context.tsx              — Global auth state (useUserAuth)
│   └── visitor-view-context.tsx
├── providers/
│   └── redux-provider.tsx
├── store/
│   └── store.ts
├── components/                       — App-level layout components (navbar, etc.)
└── middleware.ts                     — Next.js middleware (auth guards)
```

**Rules for `shared/`:**

- A component moves here only when it is used by two or more unrelated features.
- Generic inputs accept callback props instead of hardcoded API URLs.

---

## 4. Module Structure

Every feature module lives at `modules/<domain>/<feature-name>/`. All layers are optional — include only what the module needs. Any module can have `api/`, `handlers/`, `context/`, or any other layer.

```
modules/<domain>/<feature-name>/
├── api/                              ← own HTTP client
│   ├── api-constants.ts
│   └── <domain>-api.ts
├── services/
│   ├── <feature>-service.ts
│   └── index.ts                       ← barrel; optional for a single-service module
├── handlers/                         ← mutation toast boundary
│   ├── <area>.handlers.ts
│   └── index.ts                       ← barrel; optional for a single handler file
├── hooks/
│   ├── use<Feature>Query.ts           ← React Query read hook (client data fetching)
│   └── use<Feature>QueryParams.ts     ← URL search-param reader
├── types/
│   └── domain.ts
├── validations/
│   └── schemas.ts                     ← only for UI-only schemas; omit when the backend owns validation
├── constants/
├── utils/
│   ├── helpers.ts
│   └── testids.ts                     ← every data-testid the module renders
├── components/
│   ├── pages/<X>Presenter.tsx         ← layout-only composition
│   ├── (header)/ (filter)/ (table)/   ← route-group folders per UI region
│   └── dialogs/
└── <section>Context.tsx                ← co-located with the section it serves, when
                                          sibling components must share selection state
```

### Reference implementation — `modules/user-management/api-keys/`

The api-keys module is the canonical shape for a filtered, paginated, bulk-action table:

```
modules/user-management/api-keys/
├── api/
│   ├── api-constants.ts               — API_KEY_ENDPOINTS (URL builders only)
│   └── api-keys-api.ts                — getApiKeys / create / regenerate / revoke / remove
├── services/
│   └── api-keys-management-service.ts — wire→domain mapping, 422 category unpacking
├── handlers/
│   └── api-keys.handlers.ts           — toast boundary for every mutation
├── hooks/
│   ├── useApiKeysQuery.ts             — React Query list + summary + polling
│   └── useApiKeysQueryParams.ts       — search / status / limit / offset from the URL
├── types/
│   └── domain.ts                      — ApiKey, ApiKeySession, ApiKeyStatus, ...
├── utils/
│   ├── helpers.ts                     — formatDateTime, getInitials, apiKeyStatusDisplay
│   └── testids.ts                     — API_KEYS_PAGE, KEYS_TAB, API_KEY_ROW, ...
└── components/
    ├── (header)/                      — SearchSection, AddApiKey, TabSection
    ├── (keys)/                        — ApiKeysSectionContext, FilterSection,
    │                                     BulkActions, TableSection, ApiKeyTableRow,
    │                                     Regenerate / Revoke / Remove
    ├── (sessions)/                    — a second tab: the user's active login sessions
    │   ├── (filter)/                  — filters + bulk-action buttons
    │   └── (table)/                   — TableSection, TableHeaderSection, SessionTableRow,
    │                                     SessionActionMenu
    ├── dialogs/                       — CreateApiKeyDialog (controlled, presentational)
    └── pages/                         — KeysPresenter, SessionsPresenter
```

**Note:** a module has no `validations/` folder when the backend owns every validation rule. Api-keys sends the raw key name to the API and renders the 422 `details` categories back — the frontend never pre-validates.

---

### Shared Domain Code — `<domain>/common/`

Portal-shell components (header, sidebar), shared constants, and shared domain types that are used by multiple sibling modules live in `<domain>/common/` instead of being duplicated.

```
modules/<domain>/common/
├── components/    ← Shared UI shell (e.g. UserManagementPortalHeader, DashboardSidebar)
├── constants/     ← Shared constants and mock data
└── types/         ← Shared domain type definitions
```

**Import path:**

```typescript
import UserManagementPortalHeader from '@modules/common/components/UserManagementPortalHeader';
```

---

## 5. Layer Reference — All Layers

### `types/domain.ts`

Holds Next.js-local types and local composite DTOs **only**. Never re-export from `@repo/schemas-types` here — import package types directly at the call site.

```typescript
// types/domain.ts
// For Next.js-local types and composite DTOs ONLY.
// Never re-export from @repo/schemas-types here — import directly at the call site.

// Import from @repo/schemas-types only when composing a local DTO
import type {
  ProfileHeaderDataType,
  TimezoneEntryType,
} from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';

// Local composite DTOs (defined here only when the package type is not a direct fit)
export interface TransformedProfileData {
  header: ProfileHeaderDataType;
  timezones: TimezoneEntryType[];
}

// Hook-specific types
export interface UrlValidationOptions {
  id: string;
  debounceMs?: number;
}
export interface UrlValidationState {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | null;
}
```

---

### `validations/schemas.ts`

Holds UI-only constants and local Zod schemas **only**. Never re-export schemas from `@repo/schemas-types` here — import them directly at the call site.

```typescript
// validations/schemas.ts
// For UI-only constants and local Zod schemas ONLY.
// Never re-export schemas from @repo/schemas-types here — import them directly at the call site.

// UI-only constants (not derivable from Zod schemas)
export const UI_LIMITS = { MAX_FILE_SIZE: 5 * 1024 * 1024 };

// Local Zod schemas (purely UI-side with no backend equivalent)
// import z from 'zod';
// export const localFilterSchema = z.object({ search: z.string().optional() });
```

**Schemas and types are imported directly at the call site — no alias, canonical name always:**

```typescript
// In a handler or component — use canonical name, no alias
import type { UserUpdateNamePayloadType } from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';
import { UserUpdateNamePayloadValidationSchema } from '@repo/schemas-types/payload-schemas/user-management/profile/payload.schema';
```

---

### `api/api-constants.ts`

Endpoint URL builders — pure string construction, no logic.

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL;

export const USER_PROFILE_ENDPOINTS = {
  GET_PROFILE: (id: string) => `${BASE}/users/${id}/profile`,
  UPDATE_NAME: (id: string) => `${BASE}/users/${id}/name`,
} as const;
```

---

### `api/<domain>-api.ts`

One exported `async function` per HTTP call. Returns `Promise<ApiResponse<T>>`. On failure, throws via `createApiError` from `@repo/utilities/errors/error-parsing` — this attaches `.status`/`.statusCode` so `handleErrorToast` can format 422 errors correctly.

```typescript
import { createApiError } from '@repo/utilities/errors/error-parsing';
import type { ApiResponse } from '@repo/schemas-types/payload-schemas/common/api-types.schema';

export async function updateName(
  id: string,
  data: UpdateNamePayloadType
): Promise<ApiResponse<null>> {
  const response = await fetchWithCookies(ENDPOINTS.UPDATE_NAME(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = (await response.json()) as ApiResponse<null>;
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Request failed', response.status);
  }
  return result;
}
```

**Rules:**

- All functions return `Promise<ApiResponse<T>>` — never a custom `{ success: boolean; data?: T }` shape
- Check both `!response.ok` AND `!result.success` before throwing
- `ApiResponse<null>` for mutations with no payload; `ApiResponse<T>` with the data shape for reads
- Never define a local `createErrorWithStatus` helper — use `createApiError` from `@repo/utilities/errors/error-parsing`
- **No business logic, no transformation, no toast.**

---

### `services/<domain>-service.ts`

Standalone `export async function` declarations — no class, no `this`. Validates input with Zod, transforms responses, orchestrates multi-step operations.

```typescript
import { ZodError } from 'zod';
import * as api from '../api/user-profile-api';
import { updateNameSchema } from '../validations/schemas';

function wrapZodError(error: unknown): never {
  if (error instanceof ZodError)
    throw new Error(error.issues[0]?.message ?? 'Validation failed');
  throw error; // re-throw unchanged — preserves .status/.statusCode
}

export async function updateName(id: string, payload: UpdateNamePayloadType) {
  try {
    const data = updateNameSchema.parse(payload);
    return api.updateName(id, data);
  } catch (error) {
    wrapZodError(error);
  }
}
```

**No `toast`, no React, no direct `fetch`.**

---

### `handlers/`

The toast boundary. Every handler: call service → toast.success → in catch: handleErrorToast + throw.

```typescript
import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import * as userProfileService from '../services';

export const handleUpdateName = async (
  id: string,
  payload: UpdateNamePayloadType
) => {
  try {
    const result = await userProfileService.updateName(id, payload);
    toast.success(result.message || 'Name updated');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to update name');
    throw error; // always re-throw
  }
};
```

**Group handlers by UI area, not by entity:** `header.handlers.ts`, `content.handlers.ts`, `<feature>.handlers.ts`.

---

### `hooks/`

Two kinds of hooks live here.

**1. Read hooks (React Query).** Client-side reads go through `@tanstack/react-query` and call the **service** directly — never a handler, because reads have no toast boundary. Failures surface as inline error state, not toasts.

```typescript
// hooks/useApiKeysQuery.ts
export const API_KEYS_QUERY_KEY = 'userApiKeys';

export function useApiKeysQuery({ userId, status, search, limit, offset }: Params) {
  const listQuery = useQuery({
    queryKey: [API_KEYS_QUERY_KEY, userId, status, search, limit, offset],
    queryFn: () =>
      apiKeysManagementService.getApiKeys(userId, { status, search, limit, offset }),
    enabled: !!userId,
    placeholderData: keepPreviousData, // keeps the table mounted while paging
  });

  return { apiKeys: listQuery.data?.apiKeys ?? [], isLoading: listQuery.isLoading, ... };
}
```

Rules:

- Export the query key as a named constant so mutation callers can `queryClient.invalidateQueries({ queryKey: [KEY] })`.
- Two components calling the same hook with the same params share **one** request — that is the intended way to give a provider and a page section the same data without prop-drilling.
- Use `placeholderData: keepPreviousData` for paginated tables so the UI does not flash empty between pages.
- Poll only when the data says polling is warranted (e.g. a row in a transient `queued` state), never unconditionally.

**2. URL param hooks.** Filters, search, and pagination live in the URL — not in React state — so they survive refresh and are shareable. A tiny hook reads them, and the shared `Filter` component writes them.

```typescript
// hooks/useApiKeysQueryParams.ts
export function useApiKeysQueryParams() {
  const searchParams = useSearchParams();
  return {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    offset: parseInt(searchParams.get('offset') || '0', 10),
    limit: parseInt(searchParams.get('limit') || '10', 10),
  };
}
```

**3. Stateful async UI logic** — debouncing, abort controllers, race-condition guards — also belongs here. Call the service directly when the result feeds into local state.

```typescript
export function useUsernameUrlValidation(options: UrlValidationOptions) {
  const [state, setState] = useState<UrlValidationState>(INITIAL_STATE);
  const requestVersionRef = useRef(0);

  const validateUsername = useCallback(
    async (username: string) => {
      const version = ++requestVersionRef.current;
      setState(prev => ({ ...prev, isChecking: true }));
      const result = await userProfileService.checkUsername(options.id, username);
      if (requestVersionRef.current !== version) return; // stale — discard
      setState({
        isChecking: false,
        isAvailable: result.isUnique,
        error: null,
      });
    },
    [options.id]
  );

  return { ...state, validateUsername };
}
```

---

### `utils/`

Pure helper functions and static maps. No side effects. No imports from any module layer. Importable from any layer.

`utils/testids.ts` is the module's single source of `data-testid` values, grouped by UI region as `as const` objects. Components import the group they need; tests import the same constants. Never inline a raw test-id string in a component.

```typescript
// utils/testids.ts
export const API_KEY_ROW = {
  ROW_PREFIX: 'api-key-row',
  CHECKBOX: 'api-key-row-checkbox',
  REGENERATE_BUTTON: 'api-key-row-regenerate-button',
} as const;
```

---

### `components/`

React components: rendering and user interaction **only**. Components never call the API or service layers directly — they call handlers (mutations) or hooks (reads).

**Dialog loading rule:** Any modal not needed for the first render must be dynamically imported:

```typescript
const AvatarDialog = dynamic(() => import('./AvatarDialog'));
```

---

### Section context — `<Section>Context.tsx`

Add a context only when **sibling** components must share state that cannot travel as props — typically row selection shared between a bulk-action bar and a table. It is co-located with the section it serves, not in a top-level `context/` folder.

Rules:

- The provider owns selection state and derived eligibility; it does **not** own filters or pagination — those live in the URL.
- The provider calls the module's read hook with the same params the page passes, so React Query serves both from one cache entry.
- Derive per-action eligibility from server-computed flags on each row (`isRegeneratable`, `isRevocable`, `isRemovable`), never by re-deriving from `status` in the client.
- Expose selection as a plain id array when that is what the mutation endpoints accept — no `Set`→array conversion at call sites.
- The `use<Section>()` consumer hook throws when used outside its provider.

```typescript
// components/(keys)/ApiKeysSectionContext.tsx
export function useApiKeysSection() {
  const context = useContext(ApiKeysSectionContext);
  if (!context)
    throw new Error(
      'useApiKeysSection must be used inside an ApiKeysSectionProvider'
    );
  return context;
}
```

Mount the provider in the route's `layout.tsx` when the whole route needs it:

```typescript
// app/user-management/(user-management-private)/api-keys/layout.tsx
export default function ApiKeysLayout({ children }: { children: ReactNode }) {
  return <ApiKeysSectionProvider>{children}</ApiKeysSectionProvider>;
}
```

---

## 6. Component Sub-Patterns

Structure `components/` to match the UI shape of the module. Common layouts:

**Profile / section-based:**

```
components/
├── pages/
│   ├── <Domain>Page.tsx           — Client Component, owner/edit view
│   └── <Domain>PageServer.tsx     — Server Component, public read-only view
├── sections/
│   └── <section-name>/
│       ├── <Domain><Name>Section.tsx
│       └── <Domain><Name>SectionComponent.tsx
└── shared/
    └── BaseDialog.tsx, AutocompleteInput.tsx, ...
```

**Table / list page (current standard — see `modules/user-management/api-keys/`):**

Split the screen into route-group folders, one per UI region. Parentheses folders carry no routing meaning inside `modules/` — they group files and keep the folder name out of import noise.

```
components/
├── (header)/                      — page-level chrome above the data
│   ├── SearchSection.tsx          — writes `search` to the URL via shared `Filter`
│   ├── AddApiKey.tsx              — primary action + its dialog
│   └── TabSection.tsx             — fetches once, branches to a Presenter per tab
├── (<entity>)/                    — one folder per entity/tab
│   ├── <Entity>SectionContext.tsx — selection state shared by siblings
│   ├── FilterSection.tsx          — entity-scoped filters (status, etc.)
│   ├── BulkActions.tsx            — bar rendered only when a selection exists
│   ├── TableSection.tsx           — header row + body + pagination
│   ├── <Entity>TableRow.tsx       — one row
│   └── Regenerate.tsx / Revoke.tsx / Remove.tsx  — action + confirm dialog, one file each
├── (<other-entity>)/
│   ├── (filter)/                  — filters + bulk action buttons
│   └── (table)/                   — TableSection, TableHeaderSection, row, action menu
├── dialogs/                       — controlled, presentational dialogs (props in, callbacks out)
└── pages/
    ├── <Entity>Presenter.tsx      — layout-only composition of the sections above
    └── <Other>Presenter.tsx
```

**Presenter rule.** A `pages/<X>Presenter.tsx` composes sections and owns layout — nothing else. No fetching, no selection state, no business logic. It receives already-fetched data as props and hands it to the sections.

```typescript
// components/pages/KeysPresenter.tsx
export default function KeysPresenter({ apiKeys, pagination, statusSummary }: Props) {
  return (
    <div className="pt-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterSection statusSummary={statusSummary} />
          <BulkActions />
        </div>
        <TableSection apiKeys={apiKeys} pagination={pagination} />
      </div>
    </div>
  );
}
```

**One action, one file.** A mutation that has both a row-level and a bulk-level trigger is a **single** component — not two. The row and the bulk bar render the same file. It owns its confirmation dialog, calls the handler, then refetches.

```typescript
// components/(keys)/Regenerate.tsx — used by the row AND the bulk bar
export default function Regenerate({
  apiKeyIds,
  name,
  isBulk = false,
}: {
  apiKeyIds: string[];
  name: string;
  isBulk?: boolean;   // drives copy, button variant, and test ids
}) {
  const { refetchApiKeys, clearSelection } = useApiKeysSection();
  ...
  if (isBulk) clearSelection();
}
```

`isBulk` is an **explicit prop**, not `apiKeyIds.length > 1` — a bulk selection can narrow
to exactly one *eligible* id, and the bar must still read as bulk. Bulk clears the selection
afterwards, row does not, and both refetch in `finally`. See `Regenerate.tsx` / `Revoke.tsx` /
`Remove.tsx` in `modules/user-management/api-keys/components/(keys)/`.

### One component per file

Every `.tsx` file exports exactly one component. If a component needs supporting sub-pieces (a list row, a form section, an info panel), each sub-piece gets its own file — never defined inline as an extra `function`/`const` component in the same file as the one being exported.

Bad — three extra components (`AvatarInfoPanel`, `CircleCropperSection`, `AvatarTransformControls`) defined inline alongside the default-exported `AvatarEditDialog` in one file. Good — extract each into its own file, in a sibling folder named after the parent dialog (reuse an existing sibling folder if the parent is already scoped to one, e.g. an `avatar/` folder that already holds `AvatarEditDialog.tsx`):

```
header/
├── TimezoneEditDialog.tsx
└── timezone-dialog/                (new sibling folder, named after the parent)
    ├── TimezoneRow.tsx
    └── TimezoneRowList.tsx
```

This mirrors the convention already used for dialog sub-pieces (`location-dialog/CountrySelect.tsx`, `name-dialog/LegalNameInput.tsx`, `preferences-dialog/TimezoneSelect.tsx`, `account-dialog/EmailVerificationBanner.tsx`). A `.map()` callback rendering inline JSX, or a one-line formatting helper, is not a "component" for this rule — only flag a named, multi-line (roughly 10+ line) function with its own props interface that returns JSX.

### No unnecessary prop drilling

A component must not receive a prop it never reads itself, purely to forward it unchanged to a descendant that's the actual consumer. Before adding a prop to a component's interface, check whether the component itself uses it — if not, and it's only being forwarded, that intermediate component's interface should not carry it.

The fix depends on the shape of the problem:

- **Static, page-load-once reference data** (dropdown options, lookup lists) needed by scattered leaves across a deep or branching tree → React Context, scoped to just the subtree that needs it (see `context/user-profile-dropdown-options-context.tsx`: a `<X>Provider` + `use<X>()` hook that throws when called outside the provider).
- **Several unrelated fields/callbacks forwarded together through one structurally-necessary boundary** (e.g. a Client Component that has to relay page data to a child) → bundle them into one object prop (e.g. `reviewFlags`, `rowActions`) instead of naming each field individually.
- **A one-off local bundle of props only used to build one child's JSX** → composition via `children` instead of forwarding each prop individually.

A prop that the intermediate component both reads AND forwards (e.g. it also uses the value for a class name, a condition, or a derived value) is not drilling — only flag props that are purely pass-through.

---

## 7. Dependency Rules

```
ALLOWED
  Component    → Handler  → Service  → API        (mutations)
  Component    → Hook     → Service  → API        (reads)
  Component    → Section context     → Hook       (shared selection + shared query)
  Service      → validations/schemas.ts (schema values)
  Any layer    → types/domain.ts
  Any layer    → utils/
  Any layer    → @repo/schemas-types, @repo/constants, @repo/ui, @repo/utilities
  Component/Hook (when using shared stack) → <domain>/private/handlers/ (immediate parent only)

FORBIDDEN
  Component   → Service / API            skip layers
  Handler     → API                      skip service
  Service     → Component / Hook         upward dependency
  utils/      → any module layer
  Section context → service / API        contexts consume hooks, never fetch directly
  Feature A   → Feature B's internal layers via relative ../
  Module      → sibling module's layers (only parent private/ allowed)

TOAST RULE
  sonner is imported ONLY in handlers/ files.
  Toast copy comes from the API response `message` field — handlers never
  build their own wording or pluralization.

READ VS MUTATE RULE
  Reads   → hook calls the service directly; failures render as inline error state.
  Mutates → component calls a handler; the handler toasts and re-throws.
  There is no read handler — that would put a toast on a page load.

FETCH RULE
  fetchWithCookiesServer: api/ layer OR parent private/services/ (when using shared stack)
  api (from @repo/utilities/http/fetch-with-cookies): api/ layer, client reads and mutations
  fetchAPI: services/ for SSR reads only

URL-STATE RULE
  search / status / limit / offset live in the URL, written by the shared `Filter`
  component and read by a use<Feature>QueryParams hook. Never mirror them in
  React state or in a context.

SUSPENSE RULE
  Any client component reading useSearchParams (directly, via use<Feature>QueryParams,
  or via the shared `Filter` / `Pagination`) must render under a <Suspense> boundary,
  or `next build` fails with missing-suspense-with-csr-bailout. A provider mounted in
  layout.tsx needs its own boundary there — a boundary inside page.tsx cannot cover
  its own layout ancestor.
```

---

## 8. Data Flow Templates

### Write flow (mutation)

```
User interaction
  ↓
Handler (toast side-effect boundary, re-throws on error)
  ↓
Service (Zod parse → business logic → orchestration)
  ↓
API Service (single fetch call, no logic)
  ↓
Backend HTTP endpoint
```

### Read flow (SSR page load)

```
Next.js Server Component (page.tsx)
  imports via @modules/<domain>/<feature>/services
  ↓
service.getTransformedProfile(id, cookies)
  ↓
api.getProfile(id, cookies) [fetchWithCookiesServer]
  ↓
Backend HTTP endpoint → raw response → service transforms → props
```

### Read flow (client, filterable table)

```
URL search params (?search=&status=&limit=&offset=)
  ↓
use<Feature>QueryParams()            reads them
  ↓
use<Feature>Query({ ...params })     React Query, keyed on the params
  ↓
service.getX()                       maps wire DTO → domain type (ISO strings → Date)
  ↓
api.getX()                           builds the query string, throws createApiError on !ok
  ↓
Presenter receives data as props → sections render
```

The shared `Filter` component writes the params back to the URL; the key change re-runs the query. No manual refetch wiring is needed for filtering or paging.

### Mutation → refresh flow

```
Action component (row or bulk)
  ↓
handler        → service → api    (toast on success, handleErrorToast + re-throw on failure)
  ↓
on settle:  clearSelection() when bulk, then refetch()
            — or queryClient.invalidateQueries({ queryKey: [FEATURE_QUERY_KEY] })
              when the mutation is triggered outside the section provider
```

---

## 9. Route Access Patterns

### Hybrid route (owner vs. visitor split)

```typescript
// app/<domain>/(<domain>-hybrid)/[entityId]/page.tsx
import { userProfileService } from '@modules/user-management/profile/services';

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!isValidUUID(userId)) notFound();

  const cookies = buildCookieString(await headers());
  const isOwner = await ownershipChecker(cookies, userId);

  if (isOwner) return <UserProfilePage userId={userId} cookies={cookies} />;
  return <UserProfilePageServer userId={userId} />;
}
```

### Private route (authenticated only)

Protected by `middleware.ts` — no ownership check needed. `page.tsx` is a Server Component that exports `metadata` and composes the module's section components; it holds no state and does no fetching.

```typescript
// app/user-management/(user-management-private)/api-keys/page.tsx
import AddApiKey from '@/modules/user-management/api-keys/components/(header)/AddApiKey';
import SearchSection from '@/modules/user-management/api-keys/components/(header)/SearchSection';
import TabSection from '@/modules/user-management/api-keys/components/(header)/TabSection';
import { TableTitle } from '@repo/ui/components/common/table';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Keys | User Settings',
  description: 'Manage your API keys and active sessions.',
};

export default function ApiKeysPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TableTitle title="Your API Keys" description="Manage keys used to access the API" />
        <AddApiKey />
      </div>
      <SearchSection />
      <TabSection />
    </div>
  );
}
```

When the route needs a section context, add a sibling `layout.tsx` that mounts the provider — that keeps `page.tsx` a Server Component while the provider stays a Client Component:

```typescript
// app/user-management/(user-management-private)/api-keys/layout.tsx
import { ApiKeysSectionProvider } from '@/modules/user-management/api-keys/components/(keys)/ApiKeysSectionContext';

export default function ApiKeysLayout({ children }: { children: ReactNode }) {
  return <ApiKeysSectionProvider>{children}</ApiKeysSectionProvider>;
}
```

---

## 10. Creation Checklist

### Step 1 — Shared packages first

- [ ] Add Zod payload schemas to `packages/schemas-types/src/payload-schemas/<domain>/<feature>/payload.schema.ts`
- [ ] Add TypeScript response types to `packages/schemas-types/src/payload-schemas/<domain>/<feature>/response.schema.ts`
- [ ] Add shared runtime constants to `packages/constants/src/<domain>/` if needed by backend too
- [ ] Run `pnpm --filter @repo/schemas-types build` — must pass

### Step 2 — Decide which layers the module needs

Create `modules/<domain>/<feature-name>/`. Include only the layers the module actually uses.

- If the module delegates mutations to a shared stack: add handler + service files to `modules/<domain>/private/` first; the module itself has no `api/` or `handlers/`.
- If the module owns its own mutations: include `api/` and `handlers/` in the module.
- `context/` only when cross-tree state cannot be passed as props.

### Step 3 — Data layer (bottom-up)

- [ ] `api/api-constants.ts` — endpoint URL builders
- [ ] `api/<domain>-api.ts` — one `export async function` per HTTP call

### Step 4 — Business layer

- [ ] `types/domain.ts` — Next.js-local types and composite DTOs only; no re-exports from `@repo/schemas-types`
- [ ] `validations/schemas.ts` — UI-only constants and local Zod schemas only; skip the folder entirely when the backend owns every rule
- [ ] `services/<domain>-service.ts` — validation, wire→domain mapping, orchestration
- [ ] `services/index.ts` — `export *` (skip for a single-service module)
- [ ] `utils/helpers.ts` — pure helpers
- [ ] `utils/testids.ts` — every `data-testid` the module renders, grouped `as const`

### Step 5 — Presentation layer

- [ ] `handlers/<area>.handlers.ts` — toast boundary for mutations only
- [ ] `handlers/index.ts` — barrel (skip for a single handler file)
- [ ] `hooks/use<Feature>QueryParams.ts` — URL param reader
- [ ] `hooks/use<Feature>Query.ts` — React Query read hook, exporting its query key
- [ ] `components/<Section>Context.tsx` — only when siblings share selection state
- [ ] Region components under `(header)/`, `(filter)/`, `(table)/`, `(<entity>)/`
- [ ] Action components (`Regenerate`/`Revoke`/`Remove`) — one file per action, row + bulk in one component
- [ ] Dialog components (`next/dynamic` at section level)
- [ ] `components/pages/<X>Presenter.tsx` — layout composition only

### Step 6 — Route entry

- [ ] `app/<domain>/(<route-group>)/<feature>/page.tsx` — Server Component, exports `metadata`
- [ ] `app/<domain>/(<route-group>)/<feature>/layout.tsx` — only when a section provider is needed
- [ ] Import from `@modules/<domain>/<feature-name>/...`

### Step 7 — Verification

- [ ] `pnpm --filter frontend lint` passes
- [ ] `pnpm --filter frontend check-types` passes
- [ ] `pnpm --filter frontend build` passes
- [ ] All payload types come from `@repo/schemas-types` (no local redefinition)
- [ ] All response types come from `@repo/schemas-types` (no local redefinition)
- [ ] No `as` alias on any `@repo/schemas-types` import — canonical names only
- [ ] All `api/*.ts` functions return `Promise<ApiResponse<T>>` — no custom response shape interfaces
- [ ] All `api/*.ts` failure paths use `createApiError` from `@repo/utilities/errors/error-parsing`
- [ ] No `response.data?.field` accesses without `if (response.success)` guard
- [ ] Mutations with no data payload use `ApiResponse<null>`; service layer `await`s (not `return`s) to stay `Promise<void>`
- [ ] `validations/schemas.ts` contains no re-exports from `@repo/schemas-types` (custom/local code only)
- [ ] `types/domain.ts` contains no re-exports from `@repo/schemas-types` (Next.js-local types only)
- [ ] No component imports `api/` or `services/` directly
- [ ] No handler imports `api/` directly
- [ ] Toast usage exists only in `handlers/`, and toast copy comes from the API `message`
- [ ] Reads go component → hook → service (no read handler, no toast on page load)
- [ ] Filters/search/pagination live in the URL, not in React state or context
- [ ] Row-level and bulk-level variants of one mutation share a single component
- [ ] Action eligibility comes from server flags, not client-side `status` checks
- [ ] Every `data-testid` comes from `utils/testids.ts` — no inline strings
- [ ] Presenters contain layout only — no fetching, no selection state
- [ ] All dialogs not needed for first paint use `next/dynamic`

### Step 8 — Register

- [ ] Add to `apps/frontend/instructions/module-directory.instructions.md`
- [ ] Add an `architecture.md` to the module when it introduces a pattern other modules will copy

---

## 11. Anti-Patterns

| Anti-pattern                                                                      | Why it breaks                                                                                                          | Correct alternative                                                                                                                                |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component calls `fetch` or API directly                                           | Couples UI to transport; bypasses rules                                                                                | Route through handler → service → API                                                                                                              |
| Handler imports `api/` directly                                                   | Skips service-layer validation                                                                                         | Handler calls service; service calls `api/`                                                                                                        |
| Service imports `toast` or React                                                  | UI framework dependency in business logic                                                                              | Move to handler layer                                                                                                                              |
| Type redefined locally when in `@repo/schemas-types`                              | Drift between front and backend                                                                                        | Import directly from `@repo/schemas-types`                                                                                                         |
| Static import of dialog in section                                                | Bloats initial bundle                                                                                                  | `next/dynamic` for every edit/modal dialog                                                                                                         |
| Feature A imports from Feature B's `../`                                          | Cross-feature coupling                                                                                                 | Move shared code to `components/` or `packages/`                                                                                                   |
| `useEffect` with missing deps suppressed                                          | Masks stale closure bug                                                                                                | Stabilize with `useCallback` or restructure                                                                                                        |
| `fetch` inside a React Server Component section                                   | Bypasses service layer                                                                                                 | Call service from `page.tsx`, pass props down                                                                                                      |
| Ownership check inside a leaf component                                           | Access logic leaks into UI                                                                                             | Keep owner/visitor branch at route `page.tsx`                                                                                                      |
| `validations/schemas.ts` re-exports from `@repo/schemas-types`                    | The file is for custom/local code only; package schemas belong at the call site                                        | Import schema VALUES directly from `@repo/schemas-types`                                                                                           |
| `types/domain.ts` re-exports from `@repo/schemas-types`                           | The file is for local types only; re-exporting creates a pointless indirection layer                                   | Import from `@repo/schemas-types` directly at the call site                                                                                        |
| `import { X as Y } from '@repo/schemas-types/...'`                                | Creates two names for one thing; breaks grep; hides the canonical name                                                 | Use the exported name exactly as defined in `@repo/schemas-types`                                                                                  |
| Feature code imported from `app/` with `../`                                      | Bypasses `@modules` alias                                                                                              | Use `@modules/<domain>/<feature>/...`                                                                                                              |
| Local `createErrorWithStatus` helper in `_api/`                                   | Duplicates logic from `@repo/utilities/errors/error-parsing`                                                                 | `import { createApiError } from '@repo/utilities/errors/error-parsing'`                                                                                  |
| Custom `{ success: boolean; data?: T; message: string }` response type in `_api/` | Diverges from the canonical discriminated union; calling code can't narrow safely                                      | `import type { ApiResponse } from '@repo/schemas-types/payload-schemas/common/api-types.schema'`                                                   |
| `response.data?.field` without `if (response.success)`                            | `ApiResponse<T>` is a discriminated union — `.data` only exists on success branch; optional chaining masks type errors | Narrow first: `if (response.success) { response.data.field }`                                                                                      |
| Sub-component defined inline in the same file as the component that renders it    | Bloats the file, hides a reusable/testable unit, breaks the one-component-per-file convention                          | Extract to its own file in a sibling folder (see §6, "One component per file")                                                                     |
| A prop that's only read by a descendant, never by the component declaring it      | Prop drilling — couples every intermediate file to a value it doesn't use and breaks if the leaf's need changes        | Context for shared static data, a bundled object prop for a necessary boundary, or `children` composition (see §6, "No unnecessary prop drilling") |
