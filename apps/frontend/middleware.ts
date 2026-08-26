import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie names - must match backend constants
const SESSION_TOKEN_NAME = 'session_token';
const CSRF_COOKIE_NAME = 'csrf_token';

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  if (
    currentPath.startsWith('/_next') ||
    currentPath.startsWith('/api') ||
    currentPath.startsWith('/assets') ||
    currentPath === '/favicon.ico' ||
    currentPath === '/robots.txt' ||
    currentPath === '/sitemap.xml' ||
    currentPath.endsWith('.ico') ||
    currentPath.endsWith('.png') ||
    currentPath.endsWith('.webp') ||
    currentPath.endsWith('.gif') ||
    currentPath.endsWith('.jpg') ||
    currentPath.endsWith('.jpeg') ||
    currentPath.endsWith('.svg') ||
    currentPath.endsWith('.css') ||
    currentPath.endsWith('.js') ||
    currentPath.endsWith('.map') ||
    currentPath.endsWith('.woff') ||
    currentPath.endsWith('.woff2') ||
    currentPath.endsWith('.ttf') ||
    currentPath.endsWith('.otf') ||
    currentPath.endsWith('.eot') ||
    currentPath.endsWith('.json')
  ) {
    return NextResponse.next();
  }

  // Check for session token
  const sessionToken = request.cookies.get(SESSION_TOKEN_NAME)?.value;
  const csrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  // If no session token, redirect to sign-in
  if (!sessionToken) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?callbackUrl=${callbackUrl}&error=user_must_be_logged_in`,
        request.url
      )
    );
  }

  // Build cookie string for backend request
  const cookieParts: string[] = [];
  cookieParts.push(`${SESSION_TOKEN_NAME}=${sessionToken}`);
  if (csrfToken) cookieParts.push(`${CSRF_COOKIE_NAME}=${csrfToken}`);
  const cookieString = cookieParts.join('; ');

  // Validate session with backend
  // The backend will auto-rotate the session token if needed (sliding window refresh)
  let validateResponse;
  try {
    validateResponse = await fetch(
      `${process.env.API_URL}/auth/v1/session-info?includeDetails=true`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieString,
          Origin: request.nextUrl.origin,
        },
        cache: 'no-store',
      }
    );
  } catch (error) {
    // Network error - backend is unreachable
    console.error('Network error while validating session:', error);
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=backend_unavailable&callbackUrl=${callbackUrl}`,
        request.url
      )
    );
  }
  const validateData = await validateResponse.json();

  // If validation failed, redirect to sign-in
  if (!validateResponse.ok) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    if (validateResponse.status === 403) {
      const response = NextResponse.redirect(
        new URL('/access-denied', request.url)
      );

      return response;
    } else {
      const response = NextResponse.redirect(
        new URL(
          `/auth/signin?callbackUrl=${callbackUrl}&error=user_must_be_registered`,
          request.url
        )
      );
      return response;
    }
  }

  const sessionData = validateData.data;

  if (!sessionData) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?callbackUrl=${callbackUrl}&error=user_must_be_registered`,
        request.url
      )
    );
  }

  // Check route access using allowedRoutes for protected routes
  const allowedRoutes = sessionData.allowedRoutes || [];

  // Function to check if path matches pattern (handles :param and dynamic routes)
  function matchesPath(path: string, pattern: string): boolean {
    // Convert Next.js dynamic route pattern [id] to regex
    const regexPattern = pattern
      .replace(/\[\w+\]/g, '[^/]+') // [id] -> [^/]+
      .replace(/:\w+/g, '[^/]+'); // :id -> [^/]+
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  // Check if current path is allowed
  let isAllowed = false;
  for (const route of allowedRoutes) {
    if (matchesPath(currentPath, route)) {
      isAllowed = true;
      break;
    }
  }

  if (!isAllowed) {
    // Redirect to first allowed route or home page
    const redirectUrl = allowedRoutes[0] || '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  const response = NextResponse.next();

  // Forward any rotated session/csrf cookies issued by the backend (sliding window refresh).
  // getSetCookie() returns each Set-Cookie header as a separate array entry, avoiding the
  // comma-merging bug that headers.get('set-cookie') has with multiple cookies.
  const rotatedCookies = validateResponse.headers.getSetCookie();
  for (const cookie of rotatedCookies) {
    response.headers.append('set-cookie', cookie);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*'],
};
