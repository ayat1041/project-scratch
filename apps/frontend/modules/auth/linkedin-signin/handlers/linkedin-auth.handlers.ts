'use server';

// Server-side handler for LinkedIn OAuth URL generation.
// 'use server' makes every export a Next.js server action — no client imports allowed here.

import { cookies } from 'next/headers';

import { generateLinkedInOAuthUrl } from '../services/linkedin-auth-service';

const COOKIE_MAX_AGE = 60 * 10; // 10 minutes
const COOKIE_DOMAIN =
  process.env.NODE_ENV === 'development' ? undefined : '.example.com';

export async function handleLinkedInSignIn(token?: string): Promise<
  | { success: true; redirectUrl: string }
  | { success: false; error: string }
> {
  try {
    const { state, authorizationURL } = generateLinkedInOAuthUrl();
    const cookieStore = await cookies();

    const cookieBase = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as
        | 'none'
        | 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      domain: COOKIE_DOMAIN,
    };

    cookieStore.set('savedState', state, cookieBase);

    if (token) {
      cookieStore.set('linkedinAuthToken', token, cookieBase);
    }

    return { success: true, redirectUrl: authorizationURL.toString() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}
