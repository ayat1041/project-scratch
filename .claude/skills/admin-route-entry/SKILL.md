---
name: admin-route-entry
description: Layer A1 — Next.js route entries in apps/admin/app. Use when creating or editing a dashboard page.tsx, layout.tsx, route group, metadata, searchParams handling, or a role/permission guard. Covers the Presenter hand-off and the Suspense boundary.
---

# A1 — Route Entry (`app/`)

`app/` is routing only: `layout.tsx`, `page.tsx`, and `app/api/*/route.ts`. Module code lives under `modules/`.

```
app/(auth)/auth/(sign-in)/signin/page.tsx
app/(auth)/auth/(password-reset)/reset-password/page.tsx
app/dashboard/layout.tsx
app/dashboard/roles-and-permissions/page.tsx
app/dashboard/roles-and-permissions/[id]/page.tsx
app/access-denied/page.tsx
```

Route groups are kebab-case in parentheses and add no URL segment.

## The page → Presenter hand-off

An admin page is a thin Server Component. It exports `metadata`, forwards `searchParams`, and renders the module's `Presenter`. It does not fetch, and it does not hold state.

```typescript
import RolesPresenter from '@modules/user-management/roles/components/Presenter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roles & Permissions | Admin',
  description: 'Create, edit, and delete roles and their permissions.',
};

export default function RolesAndPermissionsPage({ searchParams }: { searchParams: SearchParams }) {
  return <RolesPresenter searchParams={searchParams} />;
}
```

The Presenter is where the SSR read happens — see `admin-components`.

## `searchParams` in Next.js 15

`params` and `searchParams` are **Promises**. Either `await` them, or pass the Promise straight through to the Presenter, which awaits it:

```typescript
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
```

Values are `string | string[] | undefined` — normalize with `Array.isArray(v) ? v[0] : v` before use. The service layer owns that normalization for read params.

Filter, sort, and pagination state lives in the URL and is read **server-side**. Never mirror it into client state.

## Detail routes

```typescript
export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUUID(id)) notFound();
  return <RoleDetailPresenter roleId={id} />;
}
```

Invalid route params call `notFound()` — not an error render.

## Access control

`middleware.ts` guards the authenticated surface. Any additional role or permission branch belongs **here at the route boundary or in middleware** — never inside a leaf component. A page that a role must not see redirects to `/access-denied` rather than rendering an empty table.

## `layout.tsx`

`app/dashboard/layout.tsx` owns the shell — sidebar, header, providers. Mount providers here so `page.tsx` stays a Server Component. A provider that reads `useSearchParams` needs its own `<Suspense>` boundary **in that layout**; a boundary in `page.tsx` cannot cover its layout ancestor, and this fails at `next build`, not `dev`.

## Rules

- Import module code with `@modules/...` — never relative `../` from `app/`.
- Export `metadata: Metadata` on every dashboard page.
- No `'use client'` in `page.tsx`.
- No fetching, no service call, no business logic in the route file — the Presenter does the read.
- No try/catch toast in a route file.

## Checklist

- [ ] Page is a Server Component under `app/dashboard/<area>/`
- [ ] `metadata` exported
- [ ] `searchParams` / `params` awaited or forwarded as a Promise
- [ ] Invalid params call `notFound()`
- [ ] Role/permission branching at the route or middleware only
- [ ] Rendering delegated to the module's `Presenter`
- [ ] Providers in `layout.tsx`, with their own `<Suspense>` if they read search params
- [ ] `pnpm --filter admin build` passes
