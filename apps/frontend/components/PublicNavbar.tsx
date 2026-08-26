'use client';

import AppHeader from '@repo/ui/components/common/AppHeader';
import UserAvatar from '@repo/ui/components/common/UserAvatar';
import NavSigninButton from '@repo/ui/components/common/NavSigninButton';
import { getNavOptions } from '@repo/ui/components/common/NavOptions';
import { useUserAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function PublicNavbar() {
  const { userInfo, logout } = useUserAuth();

  const role = userInfo?.roles?.[0] || '';
  const menuItems = getNavOptions({ role });

  return (
    <AppHeader variant="public" hiddenPaths={['/auth/welcome']}>
      {userInfo?.email ? (
        <UserAvatar
          userInfo={userInfo}
          menuItems={menuItems}
          onLogout={() => logout('/')}
        />
      ) : (
        <>
          <Link
            href="/auth/signup"
            className="text-blue-link hidden justify-start text-center text-base font-medium hover:underline lg:flex"
            data-testid="signup-link"
          >
            Sign Up
          </Link>
          <NavSigninButton className="" dataTestId="nav-signin-button" />
        </>
      )}
    </AppHeader>
  );
}
