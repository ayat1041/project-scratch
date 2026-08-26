# Frontend Architecture Guide

> **Scope:** `apps/frontend`
> This document is the single, module-independent reference for building any new feature module in this Next.js app. It captures the patterns, layer responsibilities, naming conventions, dependency rules, and creation checklists derived from every existing module. Follow it exactly when creating a new module.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Monorepo Shared Package Ecosystem](#2-monorepo-shared-package-ecosystem)
3. [App-Level (Global) Layer](#3-app-level-global-layer)
4. [Module Patterns](#4-module-patterns)
   - [4A. Full-Stack Profile / Setup Module](#4a-full-stack-profile--setup-module)
   - [4B. Standalone CRUD / Management Module](#4b-standalone-crud--management-module)
   - [4C. Lightweight List-Page Module](#4c-lightweight-list-page-module)
5. [Layer Reference — All Layers](#5-layer-reference--all-layers)
6. [Component Sub-Patterns](#6-component-sub-patterns)
7. [Naming Conventions](#7-naming-conventions)
8. [Dependency Rules](#8-dependency-rules)
9. [Data Flow Templates](#9-data-flow-templates)
10. [Route Access Patterns](#10-route-access-patterns)
11. [Creation Checklist](#11-creation-checklist)
12. [Anti-Patterns](#12-anti-patterns)

---

## 1. Overview

Every module in this app is a self-contained vertical slice. It owns its own types, data fetching, business logic, UI components, and tests. Modules never call into each other's internals — shared code lives in `packages/` or in `shared/` at the app root.

The architecture follows **three-layer clean architecture**:

```
╔══════════════════════════════════════════════════════════╗
║   packages/validations   packages/types   packages/constants
║          Single source of truth — front and back         ║
╚══════════════╤══════════════════════════════╤════════════╝
               │                              │
        FRONTEND (Next.js)              BACKEND (Express)
               │
┌──────────────▼───────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│     Route → Page → Section → Dialog → Handler           │
│     Responsibilities: rendering, user interaction        │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                   BUSINESS LAYER                         │
│                   Service (frontend)                     │
│     Responsibilities: Zod validation, transformation,    │
│                       orchestration, business rules      │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                   PERSISTENCE LAYER                      │
│     API Service → HTTP → Backend            │
│     Responsibilities: data access, HTTP transport        │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Shared Package Ecosystem

These packages are the **single source of truth** for all cross-boundary contracts. No module defines its own versions of these concerns.

```
packages/
├── validations/    @repo/validations
│   Layer 1: Form Schemas  (*FormSchema)       — for React Hook Form
│   Layer 2: API Schemas   (module*Schema)     — for backend controllers
│   Inferred payload types via z.infer<>
│
├── types/          @repo/types
│   TypeScript interfaces for all API response shapes
│   HTTP response wrappers
│
├── constants/      @repo/constants
│   Runtime constant arrays and objects
│   Account statuses, permission levels, etc.
│
├── ui/             @repo/ui
│   Shared React component library
│   Domain entity interfaces (ApiKey, UserPreference, etc.)
│
└── utilities/      @repo/utilities
    Pure utility functions used by both front and back
```

| Package | What it owns | Who uses it |
|---------|--------------|-------------|
| `@repo/validations` | Zod schemas + payload types | Frontend forms, frontend services, backend controllers |
| `@repo/types` | API response type interfaces | Frontend API services, frontend services |
| `@repo/constants` | Shared runtime enums and option arrays | Frontend helpers, backend services, `@repo/validations` |
| `@repo/ui` | Shared React components + domain entity interfaces | Frontend components, module `_types/domain.ts` |
| `@repo/utilities` | Pure utility functions | Frontend services, `@repo/validations` |

**Rule:** If a type, schema, or constant is used by both the frontend and backend, it must live in `packages/`. Never define it twice.

---

## 3. App-Level (Global) Layer

These live at `apps/frontend/` root and are used by all modules.

```
apps/frontend/
├── shared/
│   ├── api/
│   │   └── session-service.ts        — App-wide session/cookie helpers
│   ├── common/
│   │   ├── form/
│   │   │   ├── SuggestionField.tsx   — Generic async suggestion combobox
│   │   │   ├── MediaDetailsDialog.tsx
│   │   │   └── index.ts
│   │   └── input/
│   │       ├── FieldInput.tsx
│   │       ├── FieldSelect.tsx
│   │       ├── FieldCalender.tsx
│   │       ├── FieldCheckbox.tsx
│   │       ├── FieldDocumentUpload.tsx
│   │       └── FieldToolTip.tsx
│   └── types/
│
├── context/
│   ├── auth-context.tsx              — Global auth state (useUserAuth)
│   ├── visitor-view-context.tsx
│   └── index.ts
│
├── providers/
│   ├── redux-provider.tsx
│   └── ObservabilityProvider.tsx
│
├── store/
│   └── store.ts                      — Redux store
│
├── components/                       — App-level layout components (navbar, etc.)
│
└── middleware.ts                     — Next.js middleware (auth guards)
```

**Rules for `shared/`:**
- `shared/common/form/` and `shared/common/input/` contain generic, data-agnostic primitives. They never import from any module `_resources/` folder.
- A component moves here only when it is used by **two or more unrelated modules**.
- Generic inputs accept callback props (e.g., `onSearch`) instead of hardcoded API URLs.

---

## 4. Module Patterns

There are three distinct module patterns. Pick the one that matches the feature being built.

### 4A. Full-Stack Profile / Setup Module

**Used for:** Profile pages, setup flows, entity-level edit experiences with both owner-edit and public read-only views.

**Examples:** `users/(user-hybrid)/[userId]` (illustrative — no module built yet; see `apps/frontend/instructions/module-directory.instructions.md` §3a)

**Route shape:** `app/<domain>/(<domain>-hybrid)/[entityId]/`

```
_resources/
├── _api/
│   ├── api-constants.ts
│   └── <domain>-api-service.ts
├── _services/
│   ├── <domain>-profile-service.ts
│   └── index.ts
├── _handlers/
│   ├── header.handlers.ts
│   ├── content.handlers.ts
│   ├── <feature>.handlers.ts
│   └── index.ts
├── _hooks/
│   └── hooks.ts
├── _types/
│   └── domain.ts
├── _validations/
│   └── schemas.ts
├── _constants/
│   └── constants.ts             (when module has UI-only constants separate from schemas)
├── _utils/
│   ├── helpers.ts
│   ├── ownership-checker.ts
│   ├── dummyProfileData.ts
│   └── testids.ts
├── _components/
│   ├── pages/
│   │   ├── <Domain>Page.tsx          — Owner/edit view (Client Component)
│   │   └── <Domain>PageServer.tsx    — Public read-only view (Server Component)
│   ├── sections/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── <section-name>/
│   │       ├── <Domain><Section>Section.tsx
│   │       └── <Domain><Section>SectionComponent.tsx
│   └── shared/
│       ├── BaseDialog.tsx
│       ├── AutocompleteInput.tsx
│       └── ...reusable local primitives
└── context/
    └── <domain>-name-context.tsx   (only when cross-tree state is needed)
```

**All 10 layers are present.** See [Section 5](#5-layer-reference--all-layers) for each layer's contract.

---

### 4B. Standalone CRUD / Management Module

**Used for:** Private pages that manage a domain entity list with CRUD operations, invitations, tagging, and multi-tab views. These are not profile pages.

**Examples:** `user-management/(user-management-private)/api-keys` (illustrative — no module built yet; see `apps/frontend/instructions/module-directory.instructions.md` §4b)

**Route shape:** `app/<domain>/(<domain>-private)/<feature>/`

```
_resources/
├── _api/
│   ├── api-constants.ts
│   └── <feature>-api-service.ts
├── _services/
│   ├── <feature>-management-service.ts
│   └── index.ts
├── _handlers/
│   ├── <feature>.handlers.ts
│   ├── <sub-feature>.handlers.ts
│   └── index.ts
├── _hooks/
│   └── use<Feature>.ts
├── _types/
│   └── index.ts
├── _validations/
│   └── schemas.ts
├── _utils/
│   └── helpers.ts
└── _components/
    ├── pages/
    │   └── <Feature>PageClient.tsx   — Client-side page shell
    ├── tabs/
    │   ├── <FeatureName>Tab.tsx
    │   └── <SubFeature>Tab.tsx
    ├── modals/
    │   └── <Action>Modal.tsx
    ├── actions/
    │   └── <Feature>StatusActions.tsx
    └── tags/                         (if tagging features exist)
        └── ...
```

**All layers except `context/` are present.** No section split because the UI is tab-based, not section-based.

---

### 4C. Lightweight List-Page Module

**Used for:** Private pages that show a searchable/filterable table of records with an add/edit dialog. No separate owner vs. public view. Service layer is thin — often delegates to the parent module's service for mutations.

**Examples:** `user-management/(user-management-private)/user-preferences` (illustrative — no module built yet; see `apps/frontend/instructions/module-directory.instructions.md` §4c)

**Route shape:** `app/<domain>/(<domain>-private)/<entity>/`

```
_resources/
├── _services/
│   └── index.ts                      — Thin delegation to parent or direct API calls
├── _schema/
│   └── <entity>.schema.ts            — Local Zod schemas (form + any local validation)
├── _types/
│   └── index.ts
├── _constants/
│   └── index.ts                      — Table column ids, testids, filter options
├── _utils/
│   ├── helper.ts
│   └── testids.ts
└── _components/
    ├── (header)/
    │   └── index.tsx                 — Page header, title, action buttons
    ├── (filter)/
    │   └── index.tsx                 — Filter bar (search, status dropdowns)
    ├── (table)/
    │   ├── <Entity>Table.tsx         — Table component
    │   ├── <Entity>LabelInputCell.tsx
    │   ├── use<Entity>Table.ts       — Table state hook
    │   ├── <Entity>Dialogs.tsx       — Dialog host component
    │   └── index.tsx
    ├── Add<And>Edit<Entity>.tsx      — Add/edit form dialog
    ├── <Entity>NameField.tsx         — Specialized form field (if needed)
    └── Presenter.tsx                 — Read-only row presenter
```

**No `_api/`, `_handlers/`, `context/` layers.** Mutations go through the parent module's handler/service chain.

---

## 5. Layer Reference — All Layers

### `_types/domain.ts`

Single type hub for the entire module. All other module files import types from here — never from `@repo/types` or `@repo/ui` directly.

| Category | Source | Examples |
|----------|--------|---------|
| Domain entity interfaces | Re-exported from `@repo/ui` | `ApiKey`, `UserPreference`, `Session` |
| API response types | Re-exported from `@repo/types` | `GetProfileApiResponse`, all CRUD response types |
| Local composite DTOs | Defined here | `TransformedProfileData`, `UrlCheckResult` |
| Hook interfaces | Defined here | `UrlValidationOptions`, `UseUrlValidationResult` |

```typescript
// _types/domain.ts
export type { ApiKey, UserPreference } from '@repo/ui';
export type { GetProfileApiResponse, CreateApiKeyApiResponse } from '@repo/types';

// Local types only this module needs
export interface TransformedProfileData {
  header: ProfileHeaderDataType;
  timezones: TimezoneEntryType[];
  // ...
}
```

**Rule:** If a type source moves, only `domain.ts` changes — not 30+ consumer files.

---

### `_validations/schemas.ts`

Thin re-export layer over `@repo/validations`. Provides module-local aliases and any UI-only constants that cannot come from a Zod schema.

```typescript
// 1. UI-only constants (not derivable from Zod schemas)
export const UI_LIMITS = { MAX_FILE_SIZE: 5 * 1024 * 1024 };
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];

// 2. Form schemas — used with react-hook-form
export { bioFormSchema, nameFormSchema } from '@repo/validations';
export type { BioFormValues, NameFormValues } from '@repo/validations';

// 3. API payload schemas — used in service-layer validation
export {
  userUpdateNameSchema as updateNameSchema,
} from '@repo/validations';

// 4. Payload types — for handler call sites
export type {
  UserUpdateNamePayload as UpdateNamePayloadType,
} from '@repo/validations';
```

**This file does NOT own:** Any Zod schema logic, any payload type definitions, any response types.

---

### `_schema/<entity>.schema.ts` (List-Page pattern only)

When the module is a lightweight list-page (Pattern 4C) and does not connect to `@repo/validations`, define schemas locally here.

```typescript
// _schema/user-preferences.schema.ts
import { z } from 'zod';

export const userPreferenceFormSchema = z.object({
  preferenceKey: z.string().min(1),
  // ...
});

export type UserPreferenceFormValues = z.infer<typeof userPreferenceFormSchema>;
```

---

### `_constants/`

Module-local constants that are not Zod-derivable and not shared across modules. Use this instead of embedding magic strings in components.

```typescript
// _constants/constants.ts
export const MAX_USER_PREFERENCES = 20;
export const VERIFICATION_COOLDOWN_SECONDS = 60;

// _constants/testids.ts  (or in _utils/testids.ts)
export const PREFERENCE_TABLE = {
  DELETE_BUTTON_PREFIX: 'preference-delete-button-',
  ROW_PREFIX: 'preference-row-',
};
```

---

### `_api/api-constants.ts`

Endpoint URL builders. One function per endpoint, grouped by domain area. No logic, no state — pure string construction.

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL;

export const USER_PROFILE_ENDPOINTS = {
  GET_PROFILE: (id: string) => `${BASE}/users/${id}/profile`,
  UPDATE_NAME: (id: string) => `${BASE}/users/${id}/name`,
  CHECK_USERNAME: (id: string) => `${BASE}/users/${id}/check-username`,
};

export const CONTACT_ENDPOINTS = {
  CREATE: (id: string) => `${BASE}/users/${id}/contacts`,
  UPDATE: (id: string, contactId: string) => `${BASE}/users/${id}/contacts/${contactId}`,
  DELETE: (id: string, contactId: string) => `${BASE}/users/${id}/contacts/${contactId}`,
};
```

**Rule:** Changing an endpoint URL is a one-line edit here. Nothing else changes.

---

### `_api/<domain>-api-service.ts`

One exported `async function` per HTTP call. Flat module export — no class, no state. Payload types come from `@repo/validations`. Response types come from `@repo/types`.

```typescript
// Client-side write
export async function updateName(id: string, data: UpdateNamePayloadType) {
  const response = await api.patch(ENDPOINTS.UPDATE_NAME(id), data);
  if (!response.ok) throw createErrorWithStatus(error.message, response.status);
  return response.json() as Promise<UpdateNameApiResponse>;
}

// Server-side SSR read (passes auth cookies)
export async function getProfile(id: string, cookies?: string) {
  const response = await fetchWithCookiesServer(ENDPOINTS.GET_PROFILE(id), cookies ?? '', { method: 'GET' });
  return response.json() as Promise<GetProfileApiResponse>;
}
```

**Rule:** No business logic, no transformation, no toast. Pure HTTP mapping.

---

### `_services/<domain>-profile-service.ts`

The brain of the module. Standalone `export async function` declarations — no class, no `this`, no constructor. Barrel via `index.ts` exports with `export *`.

**What the service does:**

| Responsibility | Example |
|---------------|---------|
| Input validation | `updateNameSchema.parse(payload)` before calling the API layer |
| Data transformation | Raw API response → typed DTO (`TransformedProfileData`) |
| Orchestration | `syncTimezones`: diff arrays, delete removed, create new, update flags |
| Ownership check | Fetch session → compare IDs → return boolean |

```typescript
import * as api from '../_api/user-profile-api-service';
import { updateNameSchema } from '../_validations/schemas';

export async function updateName(id: string, payload: UpdateNamePayloadType) {
  const data = updateNameSchema.parse(payload);
  return api.updateName(id, data);
}

export async function getTransformedProfile(id: string, cookies?: string): Promise<TransformedProfileData> {
  const raw = await api.getProfile(id, cookies);
  return transformProfile(raw);  // private helper in same file
}
```

**Barrel:**
```typescript
// _services/index.ts
export * from './user-profile-service';
```

**Handler import pattern (namespace alias — required):**
```typescript
import * as userProfileService from '../_services';
// Usage:
await userProfileService.updateName(id, payload);
```

**Rule:** No UI concerns (`toast`, React state), no HTTP concerns (`fetch`, headers) in this layer.

---

### `_handlers/`

Thin presentation-layer wrappers. Bridge UI events to the service. Every handler follows the same structure:

```typescript
import * as userProfileService from '../_services';

export const handleUpdateName = async (id: string, payload: UpdateNamePayloadType) => {
  try {
    const result = await userProfileService.updateName(id, payload);
    toast.success(result.message);   // UI concern: notification
    return result;
  } catch (error) {
    handleErrorToast(error);         // UI concern: notification
    throw error;                     // Re-throw so dialog stays open
  }
};
```

**Handler files grouped by domain area:**

| File | Domain |
|------|--------|
| `header.handlers.ts` | Photo, name, URL, title, location |
| `content.handlers.ts` | Bio, avatar, preferences |
| `<feature>.handlers.ts` | CRUD for a specific entity type |

**Barrel:**
```typescript
// _handlers/index.ts
export * from './header.handlers';
export * from './content.handlers';
```

**Rule:** `sonner` toast is **handler-only** across the entire codebase.

---

### `_hooks/hooks.ts`

Encapsulates stateful, side-effectful UI logic that doesn't belong in a React component — debounced validation, async lock checks, abort controllers, cached request state.

```typescript
export function useUsernameUrlValidation(options: UrlValidationOptions) {
  const [state, setState] = useState<UrlValidationState>(INITIAL_STATE);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validateUrl = useCallback((url: string) => {
    // debounce + cache + version guard logic
  }, []);

  const checkLock = useCallback(async (url: string) => {
    // direct async call with race-condition guard
  }, []);

  return { ...state, validateUrl, checkLock };
}
```

**Rule:** Hooks may call the service directly (not via a handler) when they manage their own state and don't need toast notifications — the UI renders the state visually instead.

---

### `_utils/`

Pure helper functions. No side effects. No imports from any module layer.

| File | Contents |
|------|----------|
| `helpers.ts` | Date formatting, string manipulation, array grouping, URL sanitization |
| `ownership-checker.ts` | Delegates to service to check ownership |
| `dummyProfileData.ts` | Default empty values for initial state |
| `testids.ts` | Test ID string constants for E2E testing |

**Rule:** Helpers can be imported from any layer. They never import from the service or API layers.

---

### `_components/`

React components responsible for rendering and user interaction **only**. Components never call the API or service layers directly.

See [Section 6](#6-component-sub-patterns) for the full breakdown by pattern.

---

### `context/`

Create a context only when cross-tree UI state cannot feasibly be passed via props (e.g., a name that changes in a deep dialog and needs to update a distant header).

```typescript
// context/user-name-context.tsx
const UserNameContext = createContext<{ displayName: string; setDisplayName: (n: string) => void } | null>(null);

export function UserNameProvider({ initialName, children }: { initialName: string; children: React.ReactNode }) {
  const [displayName, setDisplayName] = useState(initialName);
  return <UserNameContext.Provider value={{ displayName, setDisplayName }}>{children}</UserNameContext.Provider>;
}

export function useUserName() {
  const ctx = useContext(UserNameContext);
  if (!ctx) throw new Error('useUserName must be used inside UserNameProvider');
  return ctx;
}
```

**Rule:** Context is consumed in the presentation layer only (components, not services or handlers).

---

## 6. Component Sub-Patterns

### Profile / Setup Module (`_components/`)

```
_components/
├── pages/
│   ├── <Domain>Page.tsx           — Async Server Component, owner/edit view
│   └── <Domain>PageServer.tsx     — Async Server Component, public read-only view
├── sections/
│   ├── index.ts                   — Named exports of all sections
│   ├── types.ts                   — Section prop interfaces
│   └── <section-name>/
│       ├── <Domain><Name>Section.tsx          — Section entry point (imports via barrel)
│       └── <Domain><Name>SectionComponent.tsx — Actual implementation
└── shared/
    ├── BaseDialog.tsx
    ├── AutocompleteInput.tsx      — Generic combobox (accepts onSearch callback)
    └── PreferenceGroupInput.tsx
```

**Page component responsibilities:**
1. Call `<domain>ProfileService.getTransformedProfile(id, cookies)` — one call.
2. Fail fast to `notFound()` when profile is unavailable.
3. Render section wrappers in a fixed order.
4. Pass normalized section props — no inline transformation.

**Section component responsibilities:**
- Receive ready-to-render props from page.
- Manage local edit state via `useState` / `useReducer`.
- Open dialogs via `next/dynamic`.
- Call handlers for mutations.

**Dialog loading rule:** Any modal not needed for the first paint must be dynamically imported:

```typescript
import dynamic from 'next/dynamic';
const NameEditDialog = dynamic(() => import('./NameEditDialog'));
```

---

### Standalone CRUD Module (`_components/`)

```
_components/
├── pages/
│   └── <Feature>PageClient.tsx    — Client Component shell (manages global filter/tab state)
├── tabs/
│   ├── <Feature>Tab.tsx           — Main entity list tab
│   └── <SubFeature>Tab.tsx        — Sessions, etc.
├── modals/
│   └── <Action>Modal.tsx          — Create modal, confirm modal
├── actions/
│   └── <Feature>StatusActions.tsx — Row-level action buttons
└── tags/                          (if tagging exists)
    └── <Tag>*.tsx
```

---

### Lightweight List-Page Module (`_components/`)

Uses **parentheses-wrapped folder names** for visual grouping of UI zones:

```
_components/
├── (header)/
│   └── index.tsx                  — Page title, primary action button (Add)
├── (filter)/
│   └── index.tsx                  — Search input, status/date filter dropdowns
├── (table)/
│   ├── <Entity>Table.tsx          — Table with column definitions
│   ├── <Entity>LabelInputCell.tsx — Inline editable cell
│   ├── use<Entity>Table.ts        — Table state hook (selection, sorting, pagination)
│   ├── <Entity>Dialogs.tsx        — Dialog host (renders Add/Edit/Delete dialogs)
│   └── index.tsx
├── AddAndEdit<Entity>.tsx         — Combined add+edit dialog form
├── <Entity>NameField.tsx          — Custom form field component (if entity needs one)
└── Presenter.tsx                  — Read-only row card / summary
```

**Page composition:** The route's `page.tsx` composes `(header)`, `(filter)`, and `(table)` as siblings:

```typescript
// page.tsx
export default async function UserPreferencesPage() {
  return (
    <div>
      <UserPreferencesHeader />
      <UserPreferencesFilter />
      <UserPreferencesTable />
    </div>
  );
}
```

---

## 7. Naming Conventions

### Folder names

| Folder | Convention | Example |
|--------|-----------|---------|
| Module resource root | `_resources/` | `_resources/` |
| Data layers | `_<layer>/` prefix | `_api/`, `_services/`, `_handlers/` |
| Component zones (list-page) | `(<zone>)/` parentheses | `(table)/`, `(filter)/`, `(header)/` |
| Context | `context/` (no prefix) | `context/` |

### File names

| File | Convention | Example |
|------|-----------|---------|
| Page components | `<Domain>Page.tsx`, `<Domain>PageServer.tsx` | `UserProfilePage.tsx` |
| Section entry | `<Domain><Name>Section.tsx` | `ProfileHeaderSection.tsx` |
| Section impl | `<Domain><Name>SectionComponent.tsx` | `ProfileHeaderSectionComponent.tsx` |
| Dialog | `<Name>EditDialog.tsx`, `<Name>Dialog.tsx` | `NameEditDialog.tsx` |
| API service | `<domain>-api-service.ts` | `user-profile-api-service.ts` |
| Service | `<domain>-profile-service.ts` | `user-profile-service.ts` |
| Handlers | `<area>.handlers.ts` | `header.handlers.ts` |
| Schema (list-page) | `<entity>.schema.ts` | `user-preferences.schema.ts` |
| Domain types | `domain.ts` | `domain.ts` |

### Symbol names

| Symbol | Convention | Example |
|--------|-----------|---------|
| Zod form schema | `<entity>FormSchema` | `userPreferenceFormSchema` |
| Zod API schema | `<domain><Action>Schema` | `userUpdateNameSchema` |
| Form values type | `<Entity>FormValues` | `UserPreferenceFormValues` |
| API payload type | `<Domain><Action>PayloadType` | `UpdateNamePayloadType` |
| API response type | `<Action><Entity>ApiResponse` | `UpdateNameApiResponse` |
| Handler function | `handle<Action><Entity>` | `handleCreateUserPreference` |
| Service function | `<action><Entity>` (camelCase) | `createUserPreference` |
| API function | same as service function | `createUserPreference` |

**Rule:** One business term per entity. Do not create synonyms for the same concept across layers.

---

## 8. Dependency Rules

```
Allowed import directions:
  Component → Handler → Service → API
  Component → Hook → Service
  Service → Validations (schemas)
  Any layer → _types/domain.ts
  Any layer → _utils/
  Any layer → @repo/validations, @repo/types, @repo/constants

Forbidden:
  Component → API  (skip layers)
  Handler → API  (skip service)
  Service → Component / Hook  (upward dependency)
  _utils/ → any module layer
  context/ → service / API
  Module A → Module B's _resources/  (cross-module coupling)
```

**Toast rule:** `sonner` (or any notification library) is imported **in handlers only**. No service, hook, or component imports it directly.

**Shared code rule:** Any utility, component, or type used by two or more unrelated modules must be moved to `shared/` (app-level) or `packages/` (cross-stack).

---

## 9. Data Flow Templates

### Write flow (mutation)

```
User interaction in Dialog/Form
  ↓
Handler (toast side-effect boundary, re-throws on error)
  ↓
Service (Zod parse → business logic → orchestration)
  ↓
API Service (single fetch call, no logic)
  ↓
Backend HTTP endpoint
  ↓
Typed response travels back up the same chain
```

### Read flow (SSR page load)

```
Next.js Server Component (page.tsx)
  ↓
service.getTransformedProfile(id, cookies)
  ↓
api.getProfile(id, cookies)  [fetchWithCookiesServer]
  ↓
Backend HTTP endpoint
  ↓
Raw API response → service transforms to TransformedProfileData
  ↓
Server Component passes section-shaped props to children
```

### Hook-driven async (debounced validation)

```
User types in input
  ↓
Hook (debounce + abort + version guard)
  ↓
Service (transform raw response to DTO)
  ↓
API Service → Backend
  ↓
Hook state updates → component re-renders with validation result
```

---

## 10. Route Access Patterns

### Hybrid route (owner vs. visitor split)

```typescript
// app/<domain>/(<domain>-hybrid)/[entityId]/page.tsx
export default async function Page({ params }: { params: { entityId: string } }) {
  if (!isValidUUID(params.entityId)) notFound();

  const cookies = buildCookieString(await headers());
  const isOwner = await ownershipChecker(cookies, params.entityId);

  if (isOwner) {
    return <OwnerPage entityId={params.entityId} cookies={cookies} />;
  }
  return <VisitorPageServer entityId={params.entityId} />;
}
```

**Rule:** Auth and access branching live at this one boundary. Never inside leaf components.

### Private route (authenticated only)

```typescript
// app/<domain>/(<domain>-private)/<feature>/page.tsx
// Protected by middleware.ts — no ownership check needed in the page
export default async function Page() {
  return <FeaturePageClient />;
}
```

---

## 11. Creation Checklist

Follow this order when building a new module. It minimizes drift and keeps contracts stable.

### Step 1 — Shared packages first

- [ ] Add Zod form schema to `packages/validations/src/modules/<domain>/`
- [ ] Add Zod API payload schema to same file (Layer 2)
- [ ] Add API response type interfaces to `packages/types/src/modules/<domain>/`
- [ ] Add shared runtime constants to `packages/constants/src/modules/<domain>/`
- [ ] Add domain entity interfaces to `packages/ui/src/components/<domain>/types.ts` if needed

### Step 2 — Determine the module pattern

- **Profile/setup with public view?** → Pattern 4A (Full-Stack Profile)
- **Private CRUD management page with tabs/actions?** → Pattern 4B (Standalone CRUD)
- **Private list page with table/filter/header?** → Pattern 4C (Lightweight List-Page)

### Step 3 — Create the folder scaffold

Create the `_resources/` folder and all sub-folders for the chosen pattern. Start with the deepest layers.

### Step 4 — Data layer (bottom-up)

- [ ] Write `_api/api-constants.ts` (endpoint builders)
- [ ] Write `_api/<domain>-api-service.ts` (one function per HTTP call)

### Step 5 — Business layer

- [ ] Write `_types/domain.ts` (re-export from `@repo/ui`, `@repo/types`; define local DTOs)
- [ ] Write `_validations/schemas.ts` (re-export from `@repo/validations`; add UI-only constants)
- [ ] Write `_services/<domain>-service.ts` (validation, transformation, orchestration)
- [ ] Write `_services/index.ts` (`export * from './...'`)
- [ ] Write `_utils/helpers.ts` (pure helper functions)

### Step 6 — Presentation layer (bottom-up within the layer)

- [ ] Write `_handlers/<area>.handlers.ts` (toast + service calls)
- [ ] Write `_handlers/index.ts` (barrel)
- [ ] Write `_hooks/hooks.ts` (stateful side-effectful logic)
- [ ] Write section components or tab components
- [ ] Write dialog components (add `next/dynamic` imports at section level)
- [ ] Write page component(s) (call service for reads; render sections/tabs)

### Step 7 — Route entry

- [ ] Write `page.tsx` (params validation + ownership split or simple render)

### Step 8 — Context (if needed)

- [ ] Write `context/<domain>-context.tsx` only if cross-tree state cannot be passed via props

### Step 9 — Verification

- [ ] `pnpm --filter frontend lint` passes
- [ ] `pnpm --filter frontend check-types` passes
- [ ] `pnpm --filter frontend build` passes
- [ ] Every request payload type comes from `@repo/validations`
- [ ] Every API response type comes from `@repo/types`
- [ ] No component imports from `_api/` directly
- [ ] No handler imports from `_api/` directly
- [ ] Toast usage exists only in `_handlers/`
- [ ] All dialogs not needed for first paint use `next/dynamic`
- [ ] `context/` folder exists only if there is a documented reason

---

## 12. Anti-Patterns

These patterns exist in older code. Do not replicate them in new modules.

| Anti-pattern | Why it breaks | Correct alternative |
|-------------|--------------|---------------------|
| Component calls `fetch` or an API function directly | Couples UI to transport; bypasses business rules | Route through handler → service → API |
| Handler imports API layer directly | Skips service-layer validation and transformation | Handler calls service; service calls API |
| Service imports `toast` or `router` | Creates UI framework dependency in business logic | Move to handler layer |
| Zod schema defined inline in a component | Duplicates contract that already exists in `@repo/validations` | Import from `@repo/validations` → re-export via `_validations/schemas.ts` |
| Static import of dialog in section | Bloats initial bundle | Use `next/dynamic` for every edit/modal dialog |
| Types re-defined locally when they exist in `@repo/types` or `@repo/ui` | Creates drift between front and backend | Re-export from `_types/domain.ts` |
| Module A imports from Module B's `_resources/` | Creates cross-module coupling that breaks refactors | Move shared code to `shared/` or `packages/` |
| `useEffect` with missing deps fixed by suppressing the lint rule without understanding the cause | Masks a stale closure bug | Stabilize the function with `useCallback` or restructure to use a functional updater |
| `useCallback(fn, [])` where `fn` is a module-level imported function | The lint rule flags an unnecessary wrapper; module-level functions are already stable | Remove the `useCallback` wrapper |
| `fetch` inside a React Server Component section | Bypasses the service layer | Call the service function from the page component and pass props down |
| Ownership check inside a leaf component | Access logic leaks into UI | Keep the owner/visitor branch at the route boundary (`page.tsx`) |
