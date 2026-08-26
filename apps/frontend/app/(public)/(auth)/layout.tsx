import { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Cookie names - must match backend constants
const SESSION_TOKEN_NAME = 'session_token';
const CSRF_COOKIE_NAME = 'csrf_token';

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const sessionToken = cookieStore.get(SESSION_TOKEN_NAME)?.value;
  const csrfToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  // If user has a session token, validate it and redirect if valid
  if (sessionToken) {
    // Build cookie string for backend request
    const cookieParts: string[] = [];
    cookieParts.push(`${SESSION_TOKEN_NAME}=${sessionToken}`);
    if (csrfToken) cookieParts.push(`${CSRF_COOKIE_NAME}=${csrfToken}`);
    const cookieString = cookieParts.join('; ');

    // Construct origin from headers
    const host = headersList.get('host') || '';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;

    let validateResponse;
    try {
      validateResponse = await fetch(
        `${process.env.API_URL}/auth/v1/session-info?includeDetails=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieString,
            Origin: origin,
          },
          cache: 'no-store',
        }
      );
    } catch (error) {
      // Network error - continue to show auth page
      console.error('Session validation failed:', error);
      return <>{children}</>;
    }

    // If session is valid, redirect to dashboard
    if (validateResponse.ok) {
      const validateData = await validateResponse.json();
      if (validateData.data) {
        redirect('/dashboard');
      }
    }
  }

  return <>{children}</>;
}
