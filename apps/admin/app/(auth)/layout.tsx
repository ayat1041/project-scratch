import { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { validateSession } from '@modules/auth/services/auth-service';

// Cookie name - must match backend constants
const SESSION_TOKEN_NAME = 'session_token';

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const sessionToken = cookieStore.get(SESSION_TOKEN_NAME)?.value;

  // If user has a session token, validate it and redirect if valid
  if (sessionToken) {
    const host = headersList.get('host') || '';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;

    const { isValid } = await validateSession(origin);
    if (isValid) {
      redirect('/dashboard');
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="bg-primary/10 absolute top-1/4 -left-32 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute -right-32 bottom-1/4 h-96 w-96 rounded-full blur-3xl" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      {children}
    </div>
  );
}
