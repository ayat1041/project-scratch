---
description: Add a Next.js route entry (L1) under apps/frontend/app — private or hybrid page.tsx, plus layout.tsx when a provider or Suspense boundary is needed.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Route Entry (L1)

## Step 1 — Gather inputs

- URL the feature is reachable at
- Access model: **private** (authenticated only) or **hybrid** (public URL, owner/visitor split)
- Module and components to compose
- Does the page read data server-side?
- Does the route need a provider (section context, React Query)?

## Step 2 — Required reading

- Skill `frontend-route-entry`
- `apps/frontend/middleware.ts` — confirm the route is covered by the auth guard for a private page

## Step 3 — Place the file

```
app/<domain>/(<domain>-private)/<feature>/page.tsx
app/<domain>/(<domain>-hybrid)/[<entityId>]/page.tsx
```

Route groups are kebab-case in parentheses. Feature code is imported through `@modules/...` or `@/modules/...` — never a relative `../` from `app/`.

## Step 4a — Private page

Server Component. Exports `metadata`. Composes the module's sections. No state, no fetching, no `'use client'`.

```typescript
export const metadata: Metadata = {
  title: 'API Keys | Account Settings',
  description: 'Manage your API keys and their permissions.',
};

export default function ApiKeysPage() {
  return (
    <div className="space-y-6 p-6">
      <TableTitle title="Your API Keys" description="..." />
      <AddApiKey />
      <SearchSection />
      <TabSection />
    </div>
  );
}
```

## Step 4b — Hybrid page

```typescript
export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!isValidUUID(userId)) notFound();

  const cookies = buildCookieString(await headers());
  const isOwner = await ownershipChecker(cookies, userId);

  if (isOwner) return <UserPage userId={userId} cookies={cookies} />;
  return <UserPageServer userId={userId} />;
}
```

`params` and `searchParams` are Promises in Next.js 15 — always `await`. Invalid params call `notFound()`, not an error render. **The ownership branch lives here and only here.**

## Step 5 — SSR reads

Call the module's **service** from the page and pass results down as props. Never `fetch`, never the `api/` layer, never a fetch inside a leaf Server Component.

## Step 6 — `layout.tsx` for providers

```typescript
export default function ApiKeysLayout({ children }: { children: ReactNode }) {
  return <ApiKeysSectionProvider>{children}</ApiKeysSectionProvider>;
}
```

Keeps `page.tsx` a Server Component while the provider stays a Client Component.

## Step 7 — Suspense (build gate)

Every client component reading `useSearchParams` — directly, via `use<Feature>QueryParams`, or via the shared `Filter` / `Pagination` — must render under `<Suspense>`. A provider mounted in `layout.tsx` needs its **own** boundary in that layout; a `page.tsx` boundary cannot cover its layout ancestor.

This fails at `next build`, not at `dev`. Run the build.

## Step 8 — Register

Add the route to the module's entry in `apps/frontend/instructions/module-directory.instructions.md`.

## Step 9 — Verify

```bash
pnpm --filter frontend lint
pnpm --filter frontend check-types
pnpm --filter frontend build
```

## Step 10 — Report

- Route path, access model, metadata.
- Provider and Suspense placement.
- Next: `/frontend-test`, then `/frontend-verify`.
