---
name: admin-route-handlers
description: Layer A8 — Next.js route handlers in apps/admin/app/api. Use when adding or reviewing a server-side endpoint owned by the admin app (file upload, image proxy, webhook receiver). Covers when one is justified, validation duties, and what must never leak to the client. Mirrors frontend-route-handlers.
---

# A8 — Next.js Route Handlers (`app/api/`)

The admin app's own server endpoints. The same two exist as in `apps/frontend`:

```
app/api/
├── file-upload/route.ts    validates and forwards uploads to backend storage
└── image-proxy/route.ts    proxies external image URLs
```

## When one is justified

| Reason | Example |
|---|---|
| A secret must never reach the browser | storage credentials in `file-upload` |
| Content must be validated server-side before it is trusted | magic-byte checks on uploads |
| A cross-origin resource must be fetched without CORS or referrer leakage | `image-proxy` |
| A third party must POST to a URL you control | webhook receiver |

**Not** justified for proxying an ordinary backend call the module's `api/` layer can make itself. Cookies and CSRF already work end-to-end through `fetchWithCookies` / `fetchWithCookiesServer`, so a pass-through route handler adds a hop and a second place for the contract to drift. Use `api/` (A7) instead.

## Shape

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
  }
  // size → MIME allowlist → extension allowlist → magic bytes → regenerated filename
  return NextResponse.json(result, { status: response.status });
}
```

- One exported function per HTTP verb, named `GET` / `POST` / `PATCH` / `DELETE`.
- Return `NextResponse.json(...)` with a status matching the actual failure.
- Keep the body in the `{ success, message, data }` envelope so the calling `api/` function can type it as `ApiResponse<T>`.
- `export const runtime = 'nodejs'` when the handler needs Node APIs (`Buffer`, `crypto`) — the edge runtime does not have them.

## Validation duties

A route handler is a trust boundary — everything arriving is hostile until checked. The upload sequence, in order:

1. Extract the field from `FormData`, confirm the runtime type.
2. Validate size against an explicit maximum.
3. Validate the MIME type against an **allowlist** — never a denylist.
4. Validate the extension against an allowlist.
5. Read the content into a buffer and verify **magic bytes** against the declared MIME type — this is what catches an executable renamed to `.png`.
6. Generate a fresh unique filename (timestamp + UUID + validated extension). Never persist the client-supplied name — it leaks information and enables overwrites.
7. Forward the reconstructed, validated object with server-only credentials.

## Secrets

Read secrets from **non-`NEXT_PUBLIC_`** env vars only — anything prefixed `NEXT_PUBLIC_` is compiled into the client bundle. Never echo a secret, an upstream URL containing credentials, or a raw upstream error body back to the client. Log the detail server-side; return a generic message.

## Consuming one

The module's `api/` layer calls it like any other endpoint — a same-origin relative path, so no `NEXT_PUBLIC_API_URL` prefix and no `fetchWithCookies` (cookies are already same-origin):

```typescript
const response = await fetch('/api/file-upload', { method: 'POST', body });
const result = (await response.json()) as ApiResponse<UploadResult>;
if (!response.ok || !result.success) {
  throw createApiError(result.message || 'Upload failed', response.status);
}
```

Components still reach it through handler → service → api. The route handler does not change the layer order.

## Rules

- No feature or business logic — a route handler validates, adapts, and forwards.
- No database access; the backend owns persistence.
- No `sonner` (there is no browser here), no React.
- Document the process flow and the security properties in a file header comment.

## Checklist

- [ ] Justified — a secret, a server-side validation, or a cross-origin fetch requires it
- [ ] One exported function per HTTP verb
- [ ] Every input validated against an allowlist before use
- [ ] Uploads: size, MIME, extension, magic bytes, regenerated filename
- [ ] Secrets from non-`NEXT_PUBLIC_` env vars, never echoed
- [ ] Response matches the `{ success, message, data }` contract
- [ ] Status codes reflect the actual failure
- [ ] Header comment documents flow and security properties
