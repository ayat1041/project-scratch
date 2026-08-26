---
description: "Core operating rules for the admin panel: layer order, module patterns, component rules, error handling, naming, new module checklist, and validation commands. Auto-injected for all admin files."
applyTo: "apps/admin/**"
---

# Admin Agent Instructions

> **Scope:** `apps/admin` — Next.js 15, React 19, TypeScript.  
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
| `react-hook-form` | `^7.x` | Always use with `zodResolver` |
| `sonner` | latest | Toast notifications — handler layer only |
| `tailwindcss` | `^4.x` | Utility-first styling |
| `@repo/ui` | workspace | Shared component library |
| `@repo/schemas-types` | workspace | Single source of truth: API payload schemas, response types, Zod validation schemas |
| `@repo/constants` | workspace | Shared runtime constants and enums |
| `@repo/utilities` | workspace | Shared pure utilities (`handleErrorToast`, `parseValidationErrors`, etc.) |

When uncertain about an API shape, read `apps/admin/package.json` to confirm the version, then use the correct API for that version.

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

- Start admin (from `apps/admin`): `pnpm run dev`
- Lint (from `apps/admin`): `pnpm run lint`
- Type check (from `apps/admin`): `pnpm run check-types`
- Build (from `apps/admin`): `pnpm run build`
- Run tests (from `apps/admin`): `pnpm run test`

After any admin code change, run at minimum:

```bash
pnpm --filter admin run lint
pnpm --filter admin run check-types
```

Before marking work done, also run:

```bash
pnpm --filter admin build
```

---

## Source Of Truth Docs

Read the relevant doc **before** changing the related area. These are authoritative — do not contradict them.

| Doc | Read before touching |
|---|---|
| `apps/admin/instructions/admin-agents.instructions.md` | Any admin module, layer, or pattern |

---

## Directory Structure

Module code lives in `modules/`, **not** inside `app/`. The `app/` directory contains only layouts and `page.tsx` route entry points.

```
apps/admin/
├── app/                              ← Routing only: layouts + page.tsx files
│   ├── (auth)/
│   │   └── auth/
│   │       ├── (password-reset)/
│   │       │   ├── forgot-password/page.tsx
│   │       │   ├── otp-change-password/page.tsx
│   │       │   └── reset-password/page.tsx
│   │       └── (sign-in)/
│   │           └── signin/page.tsx
│   └── dashboard/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── users/page.tsx
│       ├── roles-and-permissions/page.tsx
│       ├── audit-logs/page.tsx
│       └── settings/page.tsx
├── modules/                          ← All module code lives here
│   ├── auth/                         ← Auth pages and shared auth components
│   └── common/                       ← Shared portal components, constants, types, and utils
├── components/                       ← App-wide shared components
├── context/                          ← App-wide React context providers
├── constants/                        ← App-wide constants
├── providers/                        ← App-wide providers
└── store/                            ← App-wide state stores
```

`modules/` currently holds only `auth/` and `common/`. `users/`, `roles-and-permissions/`, `audit-logs/`, and `settings/` are still placeholder route entries (see `app/dashboard/<area>/page.tsx`) — the first module you build under `modules/` following the pattern below should be one of these.

**Import alias:** `@modules/*` resolves to `./modules/*` in `tsconfig.json`. Use it for all page→module and cross-module imports. Internal imports within the same module folder stay relative.

---

## Component Sub-Patterns

### Table / List Page (Presenter Pattern)

For a module whose primary UI is a filterable/sortable/paginated table (e.g. `users`, `audit-logs`), structure `components/` like this:

```
components/
├── (filter)/index.tsx      — filter field config from server-computed counts, renders shared <Filter>
├── (table)/
│   ├── <Entity>Row.tsx            — pure prop-driven row rendering
│   ├── <Entity>TableContent.tsx   — pure prop-driven row-group rendering (no hooks)
│   ├── <Entity>TableHeader.tsx
│   └── index.tsx                   — Client Component; owns local table state via a `use<Entity>TableState` hook, renders dialogs
└── Presenter.tsx              — Server Component; the page's read entry point
```

- `Presenter.tsx` is a Server Component. It parses `searchParams`, calls the module's service directly for the SSR read (see the SSR-read exception below), and composes `(filter)/index.tsx` + `(table)/index.tsx` + pagination/empty-state.
- `(filter)/index.tsx` stays a Server Component whenever it only builds static field config from props and renders a shared client component (e.g. `@repo/ui`'s `Filter`) — it does not need its own `'use client'` directive just because a descendant further down is a Client Component.
- `(table)/index.tsx` is the Client Component boundary for the table: it owns dialog-open/expansion/selection state via a `use<Entity>TableState` hook and renders the row components + dialogs.
- Row-rendering components (`<Entity>Row.tsx`, `<Entity>TableContent.tsx`) stay directive-free unless they themselves call `useState`/`useEffect`/`useReducer`/browser APIs — being rendered inside a Client Component's subtree does not require every descendant file to redeclare `'use client'`. Only add the directive to a file that itself needs client-only APIs (e.g. it wires `onClick` handlers directly onto its own elements).
- Filter/sort/pagination state lives in the URL `searchParams`, read server-side by `Presenter.tsx` — it is not duplicated into client state.
- When a sub-page's dialog wiring (open-state, feedback text, confirm handlers) is shared with a sibling submodule (e.g. a detail page reusing the same edit/delete dialogs as the table), extract it into one shared hook in the parent module's `hooks/` folder rather than re-implementing it in each consumer.

**Reference implementation:** none yet in this app — `modules/` currently holds only `auth/` and `common/`. Follow the pattern above (`Presenter.tsx` + co-located `use<Entity>Table.ts` + `components/(table)/` + `components/(filter)/`) when you build the first table-backed module (e.g. `users`); see the `nextjs-list-page-pattern` skill for a worked example from a sibling app.

### One component per file

Every `.tsx` file exports exactly one component. If a component needs supporting sub-pieces (a row renderer, a form section, an info panel), each sub-piece gets its own file — never defined inline as an extra `function`/`const` component in the same file as the one being exported. For a table module, that means a row renderer (`<Entity>Row.tsx`), a row-group renderer (`<Entity>TableContent.tsx`), and a header (`<Entity>TableHeader.tsx`) are each their own file rather than being nested inside one another. Apply the same split anywhere a component's JSX body defines a second named, multi-line (roughly 10+ line) function with its own props interface that returns JSX. A `.map()` callback rendering inline JSX, or a one-line formatting helper, is not a "component" for this rule.

### No unnecessary prop drilling

A component must not receive a prop it never reads itself, purely to forward it unchanged to a descendant that's the actual consumer. Before adding a prop to a component's interface, check whether the component itself uses it — if not, and it's only being forwarded, that intermediate component's interface should not carry it.

Admin's Client Component boundaries (`(table)/index.tsx`, `(actions)/index.tsx`) often exist specifically to hold client-only state that their Server Component parent (`Presenter.tsx`) can't hold itself — that hop is structurally necessary and should stay. What should not happen is naming each unrelated field/handler individually across that hop: bundle them into one object prop instead (e.g. `tableState: <Entity>TableState`, defined once in that module's `types/domain.ts`). A prop that the intermediate component both reads AND forwards (e.g. it also uses the value for a class name, a condition, or a derived value) is not drilling — only flag props that are purely pass-through.

---

## Non-Negotiable Admin Rules

### Layer order — must never be broken

```
Component  →  Handler  →  Service  →  API Service  →  Backend
```

- **Components** call handlers. Never call a service or API function directly from a component.
  - **Exception — SSR read:** a Server Component `Presenter.tsx` or `page.tsx` may call the service layer directly for the initial SSR read (e.g. `await usersService.getUsers(searchParams)`). This is the sanctioned read path for Server Components, not a violation of the rule above — the "never call a service directly" rule targets Client Components and write/mutation flows, which must still go through a handler.
- **Handlers** call services. Never call an API function directly from a handler.
- **Services** call API service functions directly. No business logic beyond orchestration and transformation.
- **API service functions** call `fetch`. No business logic, no transformation, no toast.

### Toast rule

`sonner` toast calls exist **in handlers only** — every single one. No service, hook, or component imports `sonner`. If you see a toast somewhere else, that is a legacy inconsistency — do not replicate it.

### Error handling rule

- Handler catch block: always call `handleErrorToast(error, fallback)` **and** `throw error`. Never swallow.
- Service catch block: call `wrapZodError(error)` — converts ZodError to plain Error, re-throws everything else unchanged.
- Auth flows use `AuthApiError` thrown from the handler — the form component calls `parseSignInError` to place field-level errors.

### Server / Client Component rule

- Default: **Server Component** (no `'use client'`).
- Add `'use client'` only when the component needs: `useState`, `useEffect`, `useReducer`, event handlers, browser APIs, context consumers.
- Never call `fetch` inside a leaf component — use the service layer from the page.
- Authorization and role checks belong at `page.tsx` or middleware boundary only — never inside leaf components.

### Shared package rule

- **All** API payload schemas, response types, and Zod validation schemas come from `@repo/schemas-types`.
- Runtime enums and option arrays come from `@repo/constants`.
- Shared UI components come from `@repo/ui`.
- Error utilities (`handleErrorToast`, `handleErrorMessage`, `parseValidationErrors`, `getErrorStatus`) come from `@repo/utilities`.
- Never define local duplicates of any type or schema that exists in `@repo/schemas-types`.

### Module isolation rule

- No module imports from another module's internal layers using relative `../` paths.
- Cross-module imports use `@modules/<other-module>/...` alias.
- Any code used by two or more unrelated modules moves to `components/` (app-wide shared) or `packages/` (cross-stack).

### Dialog loading rule

Every edit/modal dialog not needed for the first paint must use `next/dynamic`:

```typescript
import dynamic from 'next/dynamic';
const ApproveDialog = dynamic(() => import('./ApproveDialog'));
```

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
| `utils/` | Pure helpers | Formatting, string manipulation, array transforms | Imports from service/API |
| `components/` | Rendering + events | State, handlers, props | Direct API/service calls, toast |
| `constants/` | Module-level constants | Static data, mock data, display maps | Logic |

---

## Naming Rules — Quick Reference

### File naming (key rules)

| File | Name |
|---|---|
| Endpoint URL builders | `api-constants.ts` (always exactly this name) |
| HTTP transport | `<domain>-api.ts` |
| Service | `<domain>-service.ts` |
| Handler group | `<area>.handlers.ts` |
| Types hub | `domain.ts` (always exactly this name) |
| Test IDs | `testids.ts` (always exactly this name) |
| Page component | `<Domain>Page.tsx` |

### Symbol naming (key rules)

| Symbol | Convention | Example |
|---|---|---|
| Handler function | `handle<Action><Entity>` | `handleDeleteUser` |
| Service function | `<action><Entity>` camelCase | `deleteUser` |
| Zod form schema | `<entity>FormSchema` | `userFormSchema` |
| Form values type | `<Entity>FormValues` | `UserFormValues` |
| API payload type alias | `<Action><Entity>PayloadType` | `DeleteUserPayloadType` |

### Import patterns (required)

Services are always imported as a namespace alias in handlers:

```typescript
import * as usersService from '../services';
// Usage:
await usersService.deleteUser(id, payload);
```

Pages import module code via `@modules` alias:

```typescript
// In app/dashboard/users/page.tsx
import UsersPage from '@modules/users/components/pages/UsersPage';
import * as usersService from '@modules/users/services';
```

---

## Creating A New Module — Checklist

Follow this order exactly. Skipping steps causes type drift and layer violations.

### 1. Shared packages first (before any module code)

- [ ] Add Zod validation schemas and inferred payload types to `packages/schemas-types/src/payload-schemas/<domain>/<feature>/payload.schema.ts`
- [ ] Add TypeScript response types to `packages/schemas-types/src/payload-schemas/<domain>/<feature>/response.schema.ts`
- [ ] Add shared runtime constants to `packages/constants/src/<domain>/` if used by backend too
- [ ] Run `pnpm --filter @repo/schemas-types build` — must pass before touching apps

### 2. Scaffold the folder structure

Create `modules/<domain>/<module-name>/` and all sub-folders.

### 3. Data layer (build bottom-up)

- [ ] `api/api-constants.ts` — endpoint URL builder functions
- [ ] `api/<domain>-api.ts` — one `export async function` per HTTP call, `createErrorWithStatus` on `!response.ok`

### 4. Business layer

- [ ] `types/domain.ts` — re-export from `@repo/schemas-types`; define local composite DTOs only if no package type fits
- [ ] `services/<domain>-service.ts` — Zod parse → transform → orchestrate
- [ ] `services/index.ts` — `export * from './...'`
- [ ] `utils/helpers.ts` — pure helper functions

### 5. Presentation layer (bottom-up)

- [ ] `handlers/<area>.handlers.ts` — `toast.success` + `handleErrorToast` + `throw error`
- [ ] `handlers/index.ts` — barrel
- [ ] `hooks/` — debounced validation, abort, stateful async
- [ ] Table/section components
- [ ] Dialog components (use `next/dynamic` at section level)
- [ ] Page component (service call for reads → section props)

### 6. Route entry

- [ ] `app/dashboard/<domain>/<module>/page.tsx` — simple render, imports from `@modules`

### 7. Verification gate

```bash
pnpm --filter admin lint
pnpm --filter admin check-types
pnpm --filter admin build
```

Also verify manually:
- [ ] Every request payload type is from `@repo/schemas-types` (no local redefinition)
- [ ] Every API response type is from `@repo/schemas-types` (no local redefinition)
- [ ] No component imports from `api/` directly
- [ ] No handler imports from `api/` directly
- [ ] `sonner` toast exists only in `handlers/`
- [ ] All dialogs not on first paint use `next/dynamic`

---

## Dependency Rules — What Can Import What

```
✅ Allowed:
  Component      → Handler, Hook, types/domain.ts, utils/, @repo/*
  Handler        → Service, types/domain.ts, utils/, @repo/utilities
  Hook           → Service, types/domain.ts, utils/
  Service        → API Service, types/domain.ts, utils/, @repo/*
  API Service    → api-constants.ts, @repo/schemas-types, @repo/utilities
  Any layer      → types/domain.ts, utils/, @repo/*

❌ Forbidden:
  Component      → API Service (skip layers)
  Component      → Service (skip handler layer)
  Handler        → API Service (skip service)
  Service        → Component, Hook (upward dependency)
  utils/        → Service, Handler, API Service
  Module A       → Module B's internal layers via relative paths
```

---

## Error Handling Rules — Quick Reference

### API layer (`api/`)

```typescript
if (!response.ok) {
  const error = await response.json().catch(() => ({ message: 'Request failed' }));
  throw createErrorWithStatus(error.message || 'Request failed', response.status);
}
```

### Service layer (`services/`)

```typescript
try {
  const validated = schema.parse(payload);
  return await api.doSomething(validated);
} catch (error) {
  wrapZodError(error); // ZodError → plain Error; API errors re-thrown unchanged
}
```

### Handler layer (`handlers/`)

```typescript
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
```

---

## Anti-Patterns — Do Not Replicate

| Anti-pattern | Why it breaks | Correct alternative |
|---|---|---|
| Component calls `fetch` or an API function directly | Couples UI to transport, bypasses business rules | Route through handler → service → API |
| Handler imports from `api/` directly | Skips service-layer validation | Handler → service → API |
| Service imports `sonner` toast | UI framework dependency in business logic | Move toast to handler layer |
| Zod schema defined inline in a component | Duplicates contract in `@repo/schemas-types` | Import from `@repo/schemas-types` → re-export via `types/` |
| Static import of a dialog component in a section | Bloats initial bundle | `next/dynamic` for every edit/modal dialog |
| Types re-defined locally when they exist in `@repo/schemas-types` | Creates drift between front and backend | Import directly from `@repo/schemas-types` |
| Module A imports from Module B's internal layers via `../` | Cross-module coupling | Move shared code to `components/` or `packages/` |
| `handleErrorToast` swallowed without `throw error` | Component can't reset loading state | Always re-throw after toast |
| Authorization check inside a leaf component | Access logic leaks into UI | Keep auth/role branch at `page.tsx` or middleware only |
| Importing module code with relative `../` paths from `app/` | Bypasses `@modules` alias | Use `@modules/<domain>/<module>/...` |
| Sub-component defined inline in the same file as the component that renders it | Bloats the file, hides a reusable/testable unit, breaks the one-component-per-file convention | Extract to its own file (see "One component per file" above) |
| A prop that's only read by a descendant, never by the component declaring it | Prop drilling — couples every intermediate file to a value it doesn't use and breaks if the leaf's need changes | Bundle unrelated forwarded fields into one object prop (see "No unnecessary prop drilling" above) |
