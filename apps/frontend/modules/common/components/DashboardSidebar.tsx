'use client';

import { useVisitorView } from '@/context';
import { RootState } from '@/store/store';
import { ADMIN_ROLES, ROUTES } from '@repo/constants';
import {
  buildNavItems,
  DashboardSidebar,
  useSidebar,
} from '@repo/ui/components/dashboard';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function AppDashboardSidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } =
    useSidebar();
  const { isVisitorView } = useVisitorView();
  const roles = useSelector((state: RootState) => state.user.roles);

  const isAdmin = roles.some(role =>
    (ADMIN_ROLES as readonly string[]).includes(role)
  );

  // Build nav items from the route section matching the signed-in user's role.
  const navItems = useMemo(
    () => buildNavItems(isAdmin ? ROUTES.ADMIN : ROUTES.USER),
    [isAdmin]
  );

  if (isVisitorView) {
    return null;
  }

  return (
    <DashboardSidebar
      navItems={navItems}
      logoText="Starter"
      logoHref="/"
      collapsed={sidebarCollapsed}
      onToggle={toggleSidebar}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
    />
  );
}
