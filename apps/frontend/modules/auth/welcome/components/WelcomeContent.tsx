'use client';

import { useSelector } from 'react-redux';
import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { RootState } from '@/store/store';
import { UserState } from '@/store/user-info';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@repo/constants';

export default function WelcomeContent() {
  const userInfo: UserState = useSelector((state: RootState) => state.user);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const displayName = userInfo?.userName || userInfo?.email || null;

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-10 text-center">
      <h1 className="text-foreground text-4xl font-semibold md:text-5xl">
        Welcome{mounted && displayName ? `, ${displayName}` : ''}!
      </h1>

      <p className="text-muted-foreground text-lg leading-relaxed md:text-xl">
        Your account is verified and ready to go.
      </p>

      <div>
        <Link
          href={ROUTES.USER.DASHBOARD.href}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-lg px-10 py-6 text-lg font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Go to your dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
