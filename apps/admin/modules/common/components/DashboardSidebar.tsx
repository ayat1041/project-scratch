'use client';

import {
  DashboardSidebar,
  useSidebar,
  buildNavItems,
} from '@repo/ui/components/dashboard';
import { ROUTES } from '@repo/constants';
import { useMemo } from 'react';

export default function AdminSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useSidebar();

  const navItems = useMemo(() => buildNavItems(ROUTES.ADMIN), []);

  return (
    <DashboardSidebar
      navItems={navItems}
      logoText="Starter"
      logoHref="/dashboard"
      collapsed={sidebarCollapsed}
      onToggle={toggleSidebar}
      hideMobileMenu={true}
    />
  );
}
