import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { baseHeaders } from './constants/constants';

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

  // Check if accessing /auth routes
  // if (currentPath.startsWith('/auth/') || currentPath === '/auth') {
  //   if (sessionToken) {
  //     // User is already authenticated, redirect to home
  //     return NextResponse.redirect(new URL('/dashboard', request.url));
  //   }
  //   // Allow access to /auth routes if not authenticated
  //   return NextResponse.next();
  // }

  // If no session token, redirect to sign-in
  if (!sessionToken) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?callbackUrl=${callbackUrl}&error=user_must_be_registered`,
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
          'x-site-context': 'admin',
          ...baseHeaders,
        },
        cache: 'no-store',
      }
    );
  } catch (error) {
    // Network error - backend is unreachable
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=backend_unavailable&callbackUrl=${callbackUrl}`,
        request.url
      )
    );
  }

  // If validation failed, redirect to sign-in
  if (!validateResponse.ok) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    // Handle 403 Forbidden - redirect to access denied page
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

      // Clear auth cookies on failed validation
      // response.cookies.delete(SESSION_TOKEN_NAME);
      // response.cookies.delete(CSRF_COOKIE_NAME);

      return response;
    }
  }

  const validateData = await validateResponse.json();
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

  const response = NextResponse.next();

  // Forward any rotated session/csrf cookies issued by the backend (sliding window refresh).
  // getSetCookie() returns each Set-Cookie header as a separate array entry, avoiding the
  // comma-merging bug that headers.get('set-cookie') has with multiple cookies.
  const rotatedCookies = validateResponse.headers.getSetCookie();
  for (const cookie of rotatedCookies) {
    response.headers.append('set-cookie', cookie);
  }

  // Check route access using allowedRoutes

  // Function to check if path matches pattern (handles [id] and :param)
  function matchesPath(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\[\w+\]/g, '[^/]+') // [id] -> [^/]+
      .replace(/:\w+/g, '[^/]+'); // :id -> [^/]+
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  // Check if current path is allowed based on allowedRoutes
  const allowedRoutes = sessionData.allowedRoutes || [];
  let isAllowed = false;

  for (const route of allowedRoutes) {
    if (matchesPath(currentPath, route)) {
      isAllowed = true;
      break;
    }
  }

  if (!isAllowed) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // '/auth/:path*',
    '/dashboard/:path*',
  ],
};
