---
description: "Core operating rules for the frontend: layer order, module patterns, component rules, error handling, naming, new module checklist, and validation commands. Auto-injected for all frontend files."
applyTo: "apps/frontend/**"
---

# Frontend Agent Instructions

> **Scope:** `apps/frontend` — Next.js 15, React 19, TypeScript.  
> Before changing any area, read the relevant source-of-truth doc listed in **Source Of Truth Docs**. When you change this file, all agents pick up the change automatically.

---

## Technology Stack & Versions

These are the **exact versions in use**. Use the API for these versions — not older defaults from training data.

| Package | Version | Critical notes |
|---|---|---|
| `next` | `15.x` | App Router only — no Pages Router |
| `react` | `19.x` | React 19 — use `use` hook, server actions where applicable |
| `typescript` | `5.x` | Strict mode enabled |
| `zod` | `^4.x` | **Zod 4** — not Zod 3. See below. |
| `react-hook-form` | `^7.65.x` | The default for every structured form. Always paired with `zodResolver` (`@hookform/resolvers ^5.2.x`) |
| `sonner` | latest | Toast notifications — handler layer only |
| `@tanstack/react-query` | `^5.101.x` | **Client-side reads only.** Used only by modules following the live-table pattern (see `nextjs-live-table-pattern`); SSR list-page modules read via SSR instead, not React Query. Not a dependency of `apps/admin` |
| `tailwindcss` | `^4.x` | Utility-first styling |
| `@repo/ui` | workspace | Shared component library |
| `@repo/schemas-types` | workspace | Single source of truth: API payload schemas, response types, Zod validation schemas |
| `@repo/constants` | workspace | Shared runtime constants and enums |
| `@repo/utilities` | workspace | Shared pure utilities (`handleErrorToast`, `parseValidationErrors`, etc.) |

When uncertain about an API shape, read `apps/frontend/package.json` to confirm the version, then use the correct API for that version.

> **`@tanstack/react-table` is not used in this repo.** It was previously listed here as
> "table state in list-page modules"; it is in no `package.json` and imported by no file.
> Table state is the hand-rolled, co-located `components/(table)/use<Entity>Table.ts` hook —
> see the `nextjs-list-page-pattern` skill for the canonical shape (no list-page module is
> built yet in this template). Do not install a table library.

### Zod 4 — What Changed From Zod 3

The LLM default is Zod 3 patterns. This project uses **Zod 4**. Key differences:

- **`.parse()` throws, `.safeParse()` returns `{ success, data, error }`** — unchanged in v4.
- **`z.infer<typeof schema>`** — unchanged.
- **`ZodError.format()`** — output shape changed in v4. Do not rely on the exact nested structure.
- **`z.object()` strict by default** in some contexts — use `.passthrough()` explicitly if extra keys should pass through.
- **`z.union()` performance** — prefer `z.discriminatedUnion()` when a discriminant field exists.
- **`error.issues[0]?.message`** — the canonical way to get the first error message out of a `ZodError`.

### Next.js 15 — What Matters Here

- **App Router only** — no `pages/` directory.
- **Server Components are default** — only add `'use client'` when you need browser APIs, state, or event handlers.
- **`async/await` in Server Components** — call services and fetch data directly in Server Component `page.tsx`, no `useEffect` needed.
- **`next/dynamic`** — use for any dialog/modal not needed on first paint to avoid bundle bloat.
- **`cookies()` and `headers()`** — available in Server Components via `next/headers`. Pass cookie string to services for SSR auth.

---

## Runtime And Validation Commands

- Start frontend (from `apps/frontend`): `pnpm run dev`
- Lint (from `apps/frontend`): `pnpm run lint`
- Type check (from `apps/frontend`): `pnpm run check-types`
- Build (from `apps/frontend`): `pnpm run build`

After any frontend code change, run at minimum:

```bash
pnpm --filter frontend run lint
pnpm --filter frontend run check-types
```

Before marking work done, also run:

```bash
pnpm --filter frontend build
```

---

## Source Of Truth Docs

Read the relevant doc **before** changing the related area. These are authoritative — do not contradict them.

| Doc | Read before touching |
|---|---|
| `apps/frontend/instructions/module-architecture-and-layers.instructions.md` | Creating any new module, adding a layer, refactoring existing layers |
| `apps/frontend/instructions/naming-conventions.instructions.md` | Naming any file, folder, variable, function, type, or constant |
| `apps/frontend/instructions/frontend-error-handling.instructions.md` | Any try/catch, toast, inline validation state, API error, form error |
| `apps/frontend/instructions/module-directory.md` | Finding where a module lives; registering a new module |
| `apps/frontend/instructions/type-flow.instructions.md` | Type architecture, `@repo/schemas-types` structure, full-stack implementation guide |
| `apps/frontend/instructions/frontend-commands-and-skills.instructions.md` | Which skill governs each layer and which `/frontend-*` command builds it, UI → API; also records where the docs above drift from the code |

---

## Directory Structure

Feature code lives in `modules/`, **not** inside `app/`. The `app/` directory contains only layouts and `page.tsx` route entry points.

```
apps/frontend/
├── app/                        ← Routing only: layouts + page.tsx files
│   ├── (public)/(auth)/auth/   ← sign-in, sign-up, password-reset routes
│   └── (dashboard-shell)/
│       ├── dashboard/
│       ├── profile/page.tsx    🔲 Stub — "my own profile"
│       └── settings/page.tsx   🔲 Stub — account settings
├── modules/                    ← All feature code lives here
│   ├── auth/                   ← Shared auth layers + sub-feature folders
│   └── common/
│       ├── components/        ← Shared portal components (header, sidebar, notifications)
│       ├── constants/         ← Shared constants
│       └── types/             ← Shared domain types
└── shared/                     ← App-level shared code (used by 2+ features)
```

Only `auth/` and `common/` exist today. `apps/frontend/instructions/module-directory.instructions.md`
§3–4 sketches the `modules/user-management/{profile,api-keys,user-preferences}/` shape a
new module would take (Patterns 4A/4B/4C), anchored on the two 🔲 stub routes above — use
it as the reference when building the first non-auth module.

**Import alias:** `@modules/*` resolves to `./modules/*` in `tsconfig.json`. Use it for all page→feature and cross-feature imports. Internal imports within the same feature folder stay relative.

---

## Non-Negotiable Frontend Rules

### Layer order — must never be broken

```
Component  →  Handler  →  Service  →  API Service  →  Backend
```

- **Components** call handlers. Never call a service or API function directly from a component.
- **Handlers** call services. Never call an API function directly from a handler.
- **Services** call API service functions directly. No business logic beyond orchestration and transformation.
- **API service functions** call `fetch`. No business logic, no transformation, no toast.

### Toast rule

`sonner` toast calls exist **in handlers only** — every single one. No service, hook, or component imports `sonner`. If you see a toast somewhere else, that is a legacy inconsistency — do not replicate it.

### Error handling rule

- Handler catch block: always call `handleErrorToast(error, fallback)` **and** `throw error`. Never swallow.
- Service catch block: call `wrapZodError(error)` — converts ZodError to plain Error, re-throws everything else unchanged.
- `handleErrorMessage` (returns `string[]`, no toast) is used only for real-time async validation hooks (name/URL availability checks while the user types).
- Auth flows use `AuthApiError` thrown from the handler — the form component calls `parseSignInError` to place field-level errors.
- Full error handling reference: `apps/frontend/instructions/frontend-error-handling.instructions.md`

### Server / Client Component rule

- Default: **Server Component** (no `'use client'`).
- Add `'use client'` only when the component needs: `useState`, `useEffect`, `useReducer`, event handlers, browser APIs, context consumers.
- Never call `fetch` inside a leaf component — use the service layer from the page.
- Ownership check and auth branching belong at `page.tsx` boundary only — never inside leaf components.

### Shared package rule

- **All** API payload schemas, response types, and Zod validation schemas come from `@repo/schemas-types`.
- Runtime enums and option arrays come from `@repo/constants`.
- Shared UI components come from `@repo/ui`.
- Error utilities (`handleErrorToast`, `handleErrorMessage`, `parseValidationErrors`, `getErrorStatus`) come from `@repo/utilities`.
- Never define local duplicates of any type or schema that exists in `@repo/schemas-types`.

### Module isolation rule

- No feature imports from another feature's internal layers using relative `../` paths.
- Cross-feature imports use `@modules/<other-feature>/...` alias.
- Any code used by two or more unrelated features moves to `modules/<domain>/components/` (domain-shared) or `packages/` (cross-stack).

### Dialog loading rule

Every edit/modal dialog not needed for the first paint must use `next/dynamic`:

```typescript
import dynamic from 'next/dynamic';
const NameEditDialog = dynamic(() => import('./NameEditDialog'));
```

---

## Module Patterns — Quick Reference

There are three patterns. Choose before creating any folder.

| Pattern | Use when | Examples |
|---|---|---|
| **4A Full-Stack Profile** | Profile/setup page with public visitor view + authenticated owner edit view on the same route | `modules/user-management/profile/` (illustrative — see `module-directory.instructions.md` §3a) |
| **4B Standalone CRUD** | Private authenticated page with tabs, CRUD, live-updating rows | `modules/user-management/api-keys/` (illustrative — see `module-directory.instructions.md` §4b) |
| **4C Lightweight List-Page** | Private page: searchable/filterable table + add/edit dialog. Each sub-module owns its full layer stack (`api/`, `services/`, `handlers/`). | `modules/user-management/user-preferences/` (illustrative — see `module-directory.instructions.md` §4c) |

Full module pattern definitions, folder scaffolds, and layer contracts: `apps/frontend/instructions/module-architecture-and-layers.instructions.md`

---

## Layer Responsibilities — Quick Reference

| Layer | File | Does | Never does |
|---|---|---|---|
| `api/api-constants.ts` | Endpoint URL builders | Returns URL strings | Logic, state, fetch |
| `api/<domain>-api.ts` | Raw HTTP calls | `fetch`, `!response.ok` check, `createErrorWithStatus` | Business logic, transformation, toast |
| `services/` | Business logic | Zod parse, transform, orchestrate, calls `api/` directly | Toast, `fetch`, React state |
| `handlers/` | UI boundary | `toast.success`, `handleErrorToast`, `throw error` | Business logic, `fetch` |
| `hooks/` | Stateful async UI | Debounce, abort, version guard, `useState` | Toast, direct API calls |
| `types/domain.ts` | Type hub | Re-exports from `@repo/schemas-types`; local DTOs only if no package type fits | Business logic |
| `validations/schemas.ts` | Schema value re-exports | Re-exports Zod schema objects from `@repo/schemas-types` with local aliases | Types, schema definitions |
| `utils/` | Pure helpers | Formatting, string manipulation, array transforms | Imports from service/API |
| `components/` | Rendering + events | State, handlers, props | Direct API/service calls, toast |
| `context/` | Cross-tree state | React context | Service/API |

---

## Naming Rules — Quick Reference

Full naming conventions: `apps/frontend/instructions/naming-conventions.instructions.md`

### File naming (key rules)

| File | Name |
|---|---|
| Endpoint URL builders | `api-constants.ts` (always exactly this name) |
| HTTP transport | `<domain>-api.ts` |
| Service (profile module) | `<domain>-profile-service.ts` |
| Service (CRUD module) | `<domain>-management-service.ts` |
| Handler group | `<area>.handlers.ts` |
| Types hub | `domain.ts` (always exactly this name) |
| Schema re-exports | `schemas.ts` (always exactly this name) |
| Local schema (list-page) | `<entity>.schema.ts` |
| Test IDs | `testids.ts` (always exactly this name) |
| Page component | `<Domain>Page.tsx`, `<Domain>PageServer.tsx` |
| Section component | `<Domain><Section>SectionComponent.tsx` |

### Symbol naming (key rules)

| Symbol | Convention | Example |
|---|---|---|
| Handler function | `handle<Action><Entity>` | `handleCreateEducation` |
| Service function | `<action><Entity>` camelCase | `createWorkExperience` |
| Zod form schema | `<entity>FormSchema` | `apiKeyFormSchema` |
| Form values type | `<Entity>FormValues` | `ApiKeyFormValues` |
| API payload type alias | `<Action><Entity>PayloadType` | `UpdateNamePayloadType` |

### Import patterns (required)

Services are always imported as a namespace alias in handlers:

```typescript
import * as userProfileService from '../services';
// Usage:
await userProfileService.updateName(id, payload);
```

Pages import feature code via `@modules` alias:

```typescript
// In app/users/(user-hybrid)/[userId]/page.tsx
import UserProfilePage from '@modules/user-management/profile/components/pages/UserProfilePage';
import * as userProfileService from '@modules/user-management/profile/services';
```

---

## Creating A New Module — Checklist

Follow this order exactly. Skipping steps causes type drift and layer violations.

### 1. Determine the pattern

- Public + private view on the same URL? → **Pattern 4A (Full-Stack Profile)**
- Private page with tabs, invitations, or tagging? → **Pattern 4B (Standalone CRUD)**
- Private page with a table + filter + add/edit dialog? → **Pattern 4C (Lightweight List-Page)**

### 2. Shared packages first (before any module code)

- [ ] Add Zod validation schemas and inferred payload types to `packages/schemas-types/src/payload-schemas/<domain>/<feature>/payload.schema.ts`
- [ ] Add TypeScript response types to `packages/schemas-types/src/payload-schemas/<domain>/<feature>/response.schema.ts`
- [ ] Add shared runtime constants to `packages/constants/src/<domain>/` if used by backend too
- [ ] Run `pnpm --filter @repo/schemas-types build` — must pass before touching apps

### 3. Scaffold the folder structure

Create `modules/<domain>/<feature-name>/` and all sub-folders for the chosen pattern.

### 4. Data layer (build bottom-up)

- [ ] `api/api-constants.ts` — endpoint URL builder functions
- [ ] `api/<domain>-api.ts` — one `export async function` per HTTP call, `createErrorWithStatus` on `!response.ok`; `fetchAPI` for reads (`GET`), `fetchWithCookies` for mutations (`POST`/`PATCH`/`DELETE`)

### 5. Business layer

- [ ] `types/domain.ts` — re-export from `@repo/schemas-types`; define local composite DTOs only if no package type fits
- [ ] `validations/schemas.ts` — re-export Zod schema VALUES (not types) from `@repo/schemas-types` with friendly aliases
- [ ] `services/<domain>-service.ts` — Zod parse → transform → orchestrate
- [ ] `services/index.ts` — `export * from './...'`
- [ ] `utils/helpers.ts` — pure helper functions

### 6. Presentation layer (bottom-up within the layer)

- [ ] `handlers/<area>.handlers.ts` — `toast.success` + `handleErrorToast` + `throw error`
- [ ] `handlers/index.ts` — barrel
- [ ] `hooks/hooks.ts` — debounced validation, abort, stateful async
- [ ] Section/tab components
- [ ] Dialog components (use `next/dynamic` at section level)
- [ ] Page component(s) (service call for reads → section props)

### 7. Route entry

- [ ] `app/<domain>/(<route-group>)/<feature>/page.tsx` — params validation + ownership branch (Hybrid) or simple render (Private)
- [ ] Import from `@modules/<domain>/<feature-name>/...`

### 8. Context (only if needed)

- [ ] `context/<domain>-context.tsx` — only when cross-tree state cannot feasibly pass via props

### 9. Register the module

- [ ] Add the module to `apps/frontend/instructions/module-directory.md` with its pattern and status

### 10. Verification gate

```bash
pnpm --filter frontend lint
pnpm --filter frontend check-types
pnpm --filter frontend build
```

Also verify manually:
- [ ] Every request payload type is from `@repo/schemas-types` (no local redefinition)
- [ ] Every API response type is from `@repo/schemas-types` (no local redefinition)
- [ ] No component imports from `api/` directly (must go through handler → service)
- [ ] No handler imports from `api/` directly (must go through service)
- [ ] `sonner` toast exists only in `handlers/`
- [ ] All dialogs not on first paint use `next/dynamic`
- [ ] `context/` folder exists only if there is a clear reason

---

## Dependency Rules — What Can Import What

```
✅ Allowed:
  Component      → Handler, Hook, types/domain.ts, utils/, @repo/*
  Handler        → Service, types/domain.ts, utils/, @repo/utilities
  Hook           → Service, types/domain.ts, utils/
  Service        → API Service, validations/schemas.ts, types/domain.ts, utils/, @repo/*
  API Service    → api-constants.ts, @repo/schemas-types, @repo/utilities
  Any layer      → types/domain.ts, utils/, @repo/*

❌ Forbidden:
  Component      → API Service (skip layers)
  Component      → Service (skip handler layer)
  Handler        → API Service (skip service)
  Service        → Component, Hook (upward dependency)
  utils/        → Service, Handler, API Service
  context/       → Service, API Service
  Feature A      → Feature B's internal layers via relative paths
  Child feature  → Sibling feature's layers (only immediate parent private/ allowed)
```

---

## Error Handling Rules — Quick Reference

Full reference: `apps/frontend/instructions/frontend-error-handling.instructions.md`

### API layer (`api/`)

```typescript
if (!response.ok) {
  const error = await response.json().catch(() => ({ message: 'Request failed' }));
  throw createErrorWithStatus(error.message || 'Request failed', response.status);
}
```

### Service layer (`services/`)

```typescript
// Pattern A — write operations
try {
  const validated = schema.parse(payload);
  return await api.doSomething(validated);
} catch (error) {
  wrapZodError(error); // ZodError → plain Error; API errors re-thrown unchanged
}

// Pattern B — auth service (safeParse)
const validated = schema.safeParse(payload);
if (!validated.success) throw new Error(firstZodMessage(validated.error));
```

### Handler layer (`handlers/`)

```typescript
// Standard (toast + re-throw)
export const handleDoSomething = async (...) => {
  try {
    const result = await service.doSomething(...);
    toast.success(result.message);
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to do something');
    throw error; // always re-throw
  }
};

// Inline validation (no toast — returns string[])
export const handleCheckUrl = async (...) => {
  try {
    return await service.checkUrl(...);
  } catch (error) {
    return handleErrorMessage(error, 'Failed to check URL'); // string[]
  }
};
```

### Component layer

```typescript
// RHF field errors: formState.errors.field.message
// Global form error: const [errorMessage, setErrorMessage] = useState<string | null>(null)
// Inline async check: {urlValidation.error && <p>{urlValidation.error}</p>}
// Client-side business rule: toast.error('Only one contact allowed') — direct, no handler
```

---

## Anti-Patterns — Do Not Replicate

These patterns exist in older code. Never introduce them in new or refactored code.

| Anti-pattern | Why it breaks | Correct alternative |
|---|---|---|
| Component calls `fetch` or an API function directly | Couples UI to transport, bypasses business rules | Route through handler → service → API |
| Handler imports from `api/` directly | Skips service-layer validation | Handler → service → API |
| Service imports `sonner` toast | UI framework dependency in business logic | Move toast to handler layer |
| Zod schema defined inline in a component | Duplicates contract in `@repo/schemas-types` | Import from `@repo/schemas-types` → re-export value via `validations/schemas.ts` |
| Static import of a dialog component in a section | Bloats initial bundle | `next/dynamic` for every edit/modal dialog |
| Types re-defined locally when they exist in `@repo/schemas-types` | Creates drift between front and backend | Import directly from `@repo/schemas-types` |
| Feature A imports from Feature B's internal layers via `../` | Cross-feature coupling | Move shared code to `modules/<domain>/components/` or `packages/` |
| `useEffect` deps suppressed with `eslint-disable` | Masks stale closure | Stabilize with `useCallback` or restructure |
| `handleErrorToast` swallowed without `throw error` | Component can't reset loading state | Always re-throw after toast |
| `wrapZodError` wraps non-ZodErrors in `new Error(message)` | Strips `.status`/`.statusCode` from API errors | Re-throw non-ZodErrors unchanged: `throw error` |
| Toast in auth handler instead of throwing `AuthApiError` | Swallows field-level error structure | Throw `AuthApiError`; let the form component call `parseSignInError` |
| Ownership check inside a leaf component | Access logic leaks into UI | Keep owner/visitor branch at `page.tsx` boundary only |
| `fetch` inside a React Server Component leaf | Bypasses service layer | Call service from `page.tsx`, pass props down |
| Re-exporting package types through `types/domain.ts` as a proxy | Unnecessary indirection | Import directly from `@repo/schemas-types` at the call site |
| Importing feature code with relative `../` paths from `app/` | Bypasses `@modules` alias | Use `@modules/<domain>/<feature>/...` |
