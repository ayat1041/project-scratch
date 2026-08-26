'use client';

import AppHeader from '@repo/ui/components/common/AppHeader';
import UserAvatar from '@repo/ui/components/common/UserAvatar';
import { getNavOptions } from '@repo/ui/components/common/NavOptions';
import { useUserAuth } from '@/context/auth-context';
import { useVisitorView } from '@/context/visitor-view-context';
import PublicNavbar from '@/components/PublicNavbar';
import { ReactNode } from 'react';

interface DashboardPortalHeaderProps {
  notificationSlot?: ReactNode;
}

export default function DashboardPortalHeader({
  notificationSlot,
}: DashboardPortalHeaderProps) {
  const { userInfo, logout } = useUserAuth();
  const { isVisitorView } = useVisitorView();

  if (isVisitorView) {
    return <PublicNavbar />;
  }

  const role = userInfo?.roles[0] || '';
  const menuItems = getNavOptions({ role });

  return (
    <AppHeader variant="dashboard">
      {userInfo?.email && (
        <>
          {notificationSlot}
          <UserAvatar
            userInfo={userInfo}
            menuItems={menuItems}
            onLogout={() => logout('/')}
          />
        </>
      )}
    </AppHeader>
  );
}
