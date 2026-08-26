// lib/fetchWithCookies.ts
// Simplified fetch utility for single session token approach
// The server now handles token rotation automatically via sliding window refresh

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get CSRF token from cookies
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (value === undefined) continue; // Skip malformed cookies
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Fetch wrapper that:
 * 1. Automatically includes credentials (cookies)
 * 2. Adds CSRF token header for state-changing requests
 * 3. NO manual refresh needed - server handles token rotation automatically
 *
 * With the new single session token approach:
 * - Server validates session on each request
 * - If session is older than 1 hour, server auto-rotates and sets new cookies
 * - Client just needs to include credentials and CSRF token
 *
 * @param input - URL path (will be prefixed with API URL)
 * @param init - Fetch init options
 * @param API - Base API URL (defaults to NEXT_PUBLIC_API_URL)
 * @param revalidate - Next.js revalidation time
 */
export async function fetchWithCookies(
  input: RequestInfo | URL,
  init: RequestInit = {},
  API: string = apiUrl,
  revalidate: number = 0
): Promise<Response> {
  const csrfToken = getCsrfToken();
  const method = init.method?.toUpperCase() || 'GET';

  // Add CSRF token header for state-changing methods
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const headers: HeadersInit = {
    ...init.headers,
    ...(needsCsrf && csrfToken && { [CSRF_HEADER_NAME]: csrfToken }),
  };

  const fetchOptions: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  };

  // Add Next.js specific options if available
  const nextOptions = { revalidate };

  const res = await fetch(`${API}${input}`, {
    ...fetchOptions,
    next: nextOptions,
  } as RequestInit);

  // With single session token approach:
  // - 401 means session is truly expired or invalid
  // - No client-side refresh needed - server handles rotation automatically
  // - User should be redirected to login
  return res;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (url: string, options?: RequestInit) =>
    fetchWithCookies(url, { ...options, method: 'GET' }),

  post: (url: string, body?: unknown, options?: RequestInit) =>
    fetchWithCookies(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (url: string, body?: unknown, options?: RequestInit) =>
    fetchWithCookies(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: (url: string, body?: unknown, options?: RequestInit) =>
    fetchWithCookies(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (url: string, options?: RequestInit) =>
    fetchWithCookies(url, { ...options, method: 'DELETE' }),
};