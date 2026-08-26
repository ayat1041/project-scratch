'use client';

import { useEffect } from 'react';
import AppHeader from '@repo/ui/components/common/AppHeader';
import UserAvatar from '@repo/ui/components/common/UserAvatar';
import NavSigninButton from '@repo/ui/components/common/NavSigninButton';
import { getNavOptions } from '@repo/ui/components/common/NavOptions';
import { useUserAuth } from '@/context/auth-context';
import { usePathname } from 'next/navigation';

export default function PublicNavbar() {
  const { userInfo, logout, checkAuth } = useUserAuth();
  const path = usePathname();
  const role = userInfo?.roles?.[0] || '';
  const menuItems = getNavOptions({ role });

  useEffect(() => {
    const runCheckAuth = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };
    runCheckAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, userInfo?.email]);

  return (
    <AppHeader variant="public" hiddenPaths={['/dashboard']}>
      {userInfo?.email ? (
        <UserAvatar
          userInfo={userInfo}
          menuItems={menuItems}
          onLogout={() => logout('/')}
        />
      ) : (
        <NavSigninButton className="" dataTestId="nav-signin-button" />
      )}
    </AppHeader>
  );
}
