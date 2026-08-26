---
name: frontend-route-entry
description: Layer L1 — Next.js route entries in apps/frontend/app. Use when creating or editing page.tsx, layout.tsx, route groups, metadata, ownership branching, params validation, or a Suspense boundary. Covers hybrid (owner/visitor) and private routes.
---

# L1 — Route Entry (`app/`)

`app/` contains **routing only**: `layout.tsx`, `page.tsx`, `loading.tsx`, `not-found.tsx`, and `app/api/*/route.ts`. No feature code, no components, no fetching helpers.

## Route groups

Kebab-case in parentheses — Next.js syntax, no URL segment:

```
app/(public)/(auth)/...
app/user-management/(user-hybrid)/[userId]/page.tsx
app/user-management/(users-private)/users/page.tsx
```

(Both hypothetical — `apps/frontend` has no per-entity hybrid/private module left besides `auth`; model a new one on this shape.)

`-hybrid` = public URL that branches on ownership. `-private` = authenticated only, guarded by `middleware.ts`.

## Pattern A — Private route (authenticated only)

`middleware.ts` already guards it. `page.tsx` stays a **Server Component**: exports `metadata`, composes the module's section components, holds no state and does no fetching.

```typescript
// app/user-management/(users-private)/users/page.tsx
import AddMember from '@/modules/user-management/users/components/(header)/AddMember';
import SearchSection from '@/modules/user-management/users/components/(header)/SearchSection';
import TabSection from '@/modules/user-management/users/components/(header)/TabSection';
import { TableTitle } from '@repo/ui/components/common/table';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users | User Management',
  description: 'Manage platform users, invitations, and role assignments.',
};

export default function UsersPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TableTitle title="Our Users" description="Manage your platform's user accounts" />
        <AddMember />
      </div>
      <SearchSection />
      <TabSection />
    </div>
  );
}
```

## Pattern B — Hybrid route (owner vs. visitor)

Validate params, resolve cookies, check ownership, branch to two different page components. **This is the only place ownership is decided** — never inside a leaf component.

```typescript
// app/<domain>/(<domain>-hybrid)/[entityId]/page.tsx
export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!isValidUUID(userId)) notFound();

  const cookies = buildCookieString(await headers());
  const isOwner = await ownershipChecker(cookies, userId);

  if (isOwner) return <UserProfilePage userId={userId} cookies={cookies} />;
  return <UserProfilePageServer userId={userId} />;
}
```

`params` is a `Promise` in Next.js 15 — always `await` it. Same for `searchParams`.

## SSR reads

A Server Component page may call the **service** layer directly and pass the result down as props. It must never call `fetch` or the `api/` layer itself.

```typescript
import * as userProfileService from '@modules/user-management/profile/services';

const profile = await userProfileService.getTransformedProfile(id, cookies);
return <UserProfilePageServer profile={profile} />;
```

## `layout.tsx` — for providers

When the route needs a section context (or a React Query provider), mount it in a sibling `layout.tsx`. That keeps `page.tsx` a Server Component while the provider stays a Client Component.

```typescript
// app/user-management/(users-private)/users/layout.tsx
import { InvitationsSectionProvider } from '@/modules/user-management/users/components/(invitations)/InvitationsSectionContext';

export default function UsersLayout({ children }: { children: ReactNode }) {
  return <InvitationsSectionProvider>{children}</InvitationsSectionProvider>;
}
```

## Suspense boundary — build-breaking if missed

Any client component reading `useSearchParams` — directly, via `use<Feature>QueryParams`, or via the shared `Filter` / `Pagination` from `@repo/ui` — must render under `<Suspense>`.

- A boundary in `page.tsx` covers the page tree.
- A provider mounted in `layout.tsx` needs its **own** boundary in that layout — a `page.tsx` boundary cannot cover its layout ancestor.
- Missing it fails `next build` with `missing-suspense-with-csr-bailout`, not `dev`. Always run `pnpm --filter frontend build` before declaring done.

## Rules

- Import feature code with `@modules/...` or `@/modules/...` — never relative `../` from `app/`.
- Export `metadata: Metadata` on every user-facing page.
- `notFound()` on invalid route params; do not render an error state for a malformed URL.
- No `'use client'` in `page.tsx`. If interactivity is needed, it belongs in a component under `modules/`.
- No business logic, no transformation, no try/catch toast in a route file.

## Checklist

- [ ] File is `app/<domain>/(<group>)/<feature>/page.tsx`
- [ ] Server Component (no `'use client'`)
- [ ] `metadata` exported
- [ ] `params` / `searchParams` awaited; invalid params trigger `notFound()`
- [ ] Ownership branch only here (hybrid routes)
- [ ] Reads go through the service layer, never `fetch`
- [ ] `<Suspense>` wraps any `useSearchParams` consumer, in the right file
- [ ] Providers live in `layout.tsx`, not `page.tsx`
- [ ] `pnpm --filter frontend build` passes
