'use client';

import AppHeader from '@repo/ui/components/common/AppHeader';
import UserAvatar from '@repo/ui/components/common/UserAvatar';
import { getNavOptions } from '@repo/ui/components/common/NavOptions';
import { useUserAuth } from '@/context/auth-context';
import NotificationButton from './NotificationButton';

export default function AdminPortalHeader() {
  const { userInfo, logout } = useUserAuth();
  const role = userInfo?.roles?.[0] || '';
  const menuItems = getNavOptions({ role });

  return (
    <AppHeader variant="dashboard" className="shadow-md">
      <NotificationButton />
      <UserAvatar
        userInfo={userInfo}
        menuItems={menuItems}
        onLogout={() => logout('/')}
      />
    </AppHeader>
  );
}
