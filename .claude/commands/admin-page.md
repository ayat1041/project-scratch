---
description: Add a Next.js route entry (A1) under apps/admin/app — a dashboard page.tsx that forwards searchParams to a module Presenter, plus layout.tsx when a provider is needed.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Admin Route Entry (A1)

## Step 1 — Gather inputs

- Dashboard URL the module lives at
- Which roles/permissions may reach it
- The module's Presenter to render
- Is it a list route, a detail route (`[id]`), or both?
- Does the route need a provider?

## Step 2 — Required reading

- Skill `admin-route-entry`
- `apps/admin/middleware.ts` — confirm the route is covered by the auth guard

## Step 3 — Place the file

```
app/dashboard/<area>/page.tsx
app/dashboard/<area>/[id]/<sub>/page.tsx
```

Import module code with `@modules/...` — never a relative `../` from `app/`.

## Step 4a — List route

```typescript
import RolesPresenter from '@modules/user-management/roles/components/Presenter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roles & Permissions | Admin',
  description: 'Manage platform roles and the permissions assigned to them.',
};

export default function RolesPage({ searchParams }: { searchParams: SearchParams }) {
  return <RolesPresenter searchParams={searchParams} />;
}
```

Thin Server Component: exports `metadata`, forwards `searchParams`, renders the Presenter. **No fetching, no state, no `'use client'`.** The Presenter does the SSR read.

`searchParams` is a Promise in Next.js 15 — forward it as one, or `await` it. Never mirror it into client state.

## Step 4b — Detail route

```typescript
export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUUID(id)) notFound();
  return <RoleDetailPresenter roleId={id} />;
}
```

Invalid params call `notFound()`, not an error render.

## Step 5 — Access control

`middleware.ts` guards the authenticated surface. Any extra role or permission branch belongs **here or in middleware** — never in a leaf component. A route a role must not see redirects to `/access-denied` rather than rendering an empty table, which reads as "no data" and misleads.

State which roles may reach the route and where that is enforced.

## Step 6 — `layout.tsx`

`app/dashboard/layout.tsx` owns the shell. Mount any new provider there so `page.tsx` stays a Server Component. A provider reading `useSearchParams` needs its **own** `<Suspense>` boundary in that layout — a boundary in `page.tsx` cannot cover its layout ancestor, and this fails at `next build`, not `dev`.

## Step 7 — Verify

```bash
pnpm --filter admin lint
pnpm --filter admin check-types
pnpm --filter admin build
```

## Step 8 — Report

- Route path, roles permitted, and where that is enforced.
- Metadata.
- Provider and Suspense placement, if any.
- Next: `/admin-test`, then `/admin-verify`.
