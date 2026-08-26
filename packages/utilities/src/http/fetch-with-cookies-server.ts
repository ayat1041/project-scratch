'use server';

import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

const apiUrl = process.env.API_URL || '';

/**
 * Extract CSRF token from cookie string
 */
function getCsrfTokenFromCookies(cookieString: string): string | null {
  const cookieList = cookieString.split(';');
  for (const cookie of cookieList) {
    const [name, value] = cookie.trim().split('=');
    if (value === undefined) continue;
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Extend RequestInit to include Next.js specific properties
interface ExtendedRequestInit extends RequestInit {
  next?: {
    revalidate: number;
  };
  cache?:
  | 'no-cache'
  | 'no-store'
  | 'default'
  | 'force-cache'
  | 'only-if-cached'
  | 'reload';
}

/**
 * Server-side fetch wrapper that:
 * 1. Reads cookies internally via next/headers
 * 2. Sends cookies in Cookie header
 * 3. Adds CSRF token header for state-changing requests
 * 4. NO manual refresh needed - server handles token rotation automatically
 */
export async function fetchWithCookiesServer(
  input: RequestInfo | URL,
  init: ExtendedRequestInit = {},
  API: string = apiUrl
): Promise<Response> {
  const cookieString = (await cookies()).toString();
  const csrfToken = getCsrfTokenFromCookies(cookieString);
  const method = init.method?.toUpperCase() || 'GET';

  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const headers: HeadersInit = {
    Cookie: cookieString,
    ...init.headers,
    ...(needsCsrf && csrfToken && { [CSRF_HEADER_NAME]: csrfToken }),
  };

  return fetch(`${API}${input}`, {
    ...init,
    headers,
    credentials: 'include',
  });
}
