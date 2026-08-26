---
name: frontend-route-handlers
description: Layer L8 — Next.js route handlers in apps/frontend/app/api/*/route.ts. Use when adding or reviewing a server-side endpoint owned by the frontend (file upload, image proxy, webhook receiver). Covers when a route handler is justified at all, validation duties, and what must never leak to the client.
---

# L8 — Next.js Route Handlers (`app/api/`)

These are the frontend's own server endpoints. They exist **only** when the browser must not do the work directly:

```
app/api/
├── file-upload/route.ts    validates and forwards uploads to backend R2 storage
└── image-proxy/route.ts    proxies external image URLs
```

## When a route handler is justified

| Reason | Example |
|---|---|
| A secret must never reach the browser | R2 credentials in `file-upload` |
| Content must be validated server-side before it is trusted | magic-byte checks on uploads |
| A cross-origin resource must be fetched without CORS or without leaking the referrer | `image-proxy` |
| A third party must POST to a URL you control | webhook receiver |

**Not** justified for: proxying an ordinary backend call the module's `api/` layer can make itself. Cookies and CSRF already work end-to-end through `fetchWithCookies` / `fetchWithCookiesServer`, so a pass-through route handler adds a hop and a second place for the contract to drift. Use `api/` (L7) instead.

## Shape

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, message: 'File too large' }, { status: 413 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ success: false, message: 'Unsupported file type' }, { status: 415 });
  }

  // ... forward to the backend with server-only credentials ...

  return NextResponse.json(result, { status: response.status });
}
```

- Export the HTTP verb by name: `GET`, `POST`, `PATCH`, `DELETE`. One verb, one exported function.
- Return `NextResponse.json(...)` with a status that matches the failure.
- Keep the response body in the same `{ success, message, data }` shape the rest of the stack uses, so the calling `api/` function can still type it as `ApiResponse<T>`.

## Validation duties

A route handler is a trust boundary — everything arriving is hostile until checked. The `file-upload` handler is the reference for the full sequence:

1. Extract the field from `FormData`, confirm the runtime type.
2. Validate size against an explicit maximum.
3. Validate the MIME type against an **allowlist** (never a denylist).
4. Validate the extension against an allowlist.
5. Read the content into a buffer and verify **magic bytes** against the declared MIME type — this is what catches an executable renamed to `.png`.
6. Generate a fresh, unique filename (timestamp + UUID + validated extension). Never persist the client-supplied name — it leaks information and enables overwrites.
7. Forward the reconstructed, validated object with server-only credentials.

## Secrets

- Read secrets from **non-`NEXT_PUBLIC_`** env vars only. Anything prefixed `NEXT_PUBLIC_` is compiled into the client bundle.
- Never echo a secret, an upstream URL containing credentials, or a raw upstream error body back to the client. Log the detail server-side; return a generic message.

## Consuming a route handler

The module's `api/` layer calls it like any other endpoint — a same-origin relative path, so no `NEXT_PUBLIC_API_URL` prefix and no `fetchWithCookies` (cookies are already same-origin):

```typescript
export async function uploadFile(file: File, folder: string): Promise<ApiResponse<UploadResult>> {
  const body = new FormData();
  body.append('file', file);
  body.append('folder', folder);

  const response = await fetch('/api/file-upload', { method: 'POST', body });
  const result = (await response.json()) as ApiResponse<UploadResult>;
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Upload failed', response.status);
  }
  return result;
}
```

Components still reach it through handler → service → api. The route handler does not change the layer order.

## Rules

- No feature/business logic. A route handler validates, adapts, and forwards.
- No database access — the backend owns persistence.
- No `sonner` (there is no browser here), no React.
- Document the process flow and the security properties in a file header comment, as `file-upload/route.ts` does.
- Set `export const runtime = 'nodejs'` explicitly when the handler needs Node APIs (`Buffer`, `crypto`) — the edge runtime does not have them.

## Checklist

- [ ] The handler is justified — a secret, a server-side validation, or a cross-origin fetch requires it
- [ ] One exported function per HTTP verb
- [ ] Every input validated against an allowlist before use
- [ ] Uploads: size, MIME, extension, magic bytes, regenerated filename
- [ ] Secrets read from non-`NEXT_PUBLIC_` env vars and never echoed
- [ ] Response body matches the `{ success, message, data }` contract
- [ ] Status codes reflect the actual failure
- [ ] Header comment documents flow and security properties
