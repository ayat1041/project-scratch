import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOST = 'cdn.example.com';
const ALLOWED_PROTOCOLS = new Set(['https:']);
const MAX_RESPONSE_SIZE = 20 * 1024 * 1024; // 20MB

// Only trust these content types from upstream — never serve HTML/JS/etc.
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]);

// Map allowed content types to safe extensions for validation
const CONTENT_TYPE_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'application/pdf': ['.pdf'],
};

function getPathExtension(pathname: string): string {
  const parts = pathname.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].split('?')[0]}` : '';
}

function isPathSafe(pathname: string): boolean {
  // Block path traversal attempts
  const decoded = decodeURIComponent(pathname);
  return !decoded.includes('..') && !decoded.includes('//');
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter.' },
      { status: 400 }
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url.' }, { status: 400 });
  }

  // Enforce HTTPS only
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return NextResponse.json(
      { error: 'URL protocol not allowed.' },
      { status: 400 }
    );
  }

  // Enforce allowed host
  if (parsed.hostname !== ALLOWED_HOST) {
    return NextResponse.json(
      { error: 'URL host not allowed.' },
      { status: 403 }
    );
  }

  // Block path traversal
  if (!isPathSafe(parsed.pathname)) {
    return NextResponse.json({ error: 'Invalid URL path.' }, { status: 400 });
  }

  // Check file extension is expected
  const ext = getPathExtension(parsed.pathname);
  const validExtensions = Object.values(CONTENT_TYPE_EXTENSIONS).flat();
  if (!validExtensions.includes(ext)) {
    return NextResponse.json(
      { error: 'File type not permitted.' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(url, {
      // Don't follow open redirects to other hosts
      redirect: 'error',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image.' },
        { status: upstream.status }
      );
    }

    // Check Content-Length before buffering to prevent memory exhaustion
    const contentLength = upstream.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      return NextResponse.json({ error: 'File too large.' }, { status: 413 });
    }

    // Never trust Content-Type from upstream — derive it from allowlist only
    const upstreamContentType =
      upstream.headers.get('content-type')?.split(';')[0].trim() ?? '';
    if (!ALLOWED_CONTENT_TYPES.has(upstreamContentType)) {
      return NextResponse.json(
        { error: 'Upstream content type not permitted.' },
        { status: 400 }
      );
    }

    // Verify extension matches the actual content type returned
    const expectedExtensions = CONTENT_TYPE_EXTENSIONS[upstreamContentType];
    if (!expectedExtensions?.includes(ext)) {
      return NextResponse.json(
        { error: 'File extension does not match content type.' },
        { status: 400 }
      );
    }

    const body = await upstream.arrayBuffer();

    // Final size check after buffering (Content-Length can be absent or spoofed)
    if (body.byteLength > MAX_RESPONSE_SIZE) {
      return NextResponse.json({ error: 'File too large.' }, { status: 413 });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        // Use the allowlisted type, not blindly forwarded from upstream
        'Content-Type': upstreamContentType,
        // Force browser to download, never execute (especially important for SVG)
        'Content-Disposition': 'inline',
        // Prevent browser sniffing the content type
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
