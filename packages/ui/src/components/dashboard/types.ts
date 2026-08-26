import { ReactNode } from 'react';

export interface SubNavItem {
    title: string;
    url: string;
    icon: React.ElementType;
    badge?: number;
}

export interface NavItem {
    title: string;
    url?: string;
    icon: React.ElementType;
    subItems?: SubNavItem[];
    badge?: number;
}

export interface DashboardSidebarProps {
    navItems: NavItem[];
    logoText: string;
    logoHref?: string;
    collapsed?: boolean;
    onToggle?: () => void;
    mobileMenuOpen?: boolean;
    setMobileMenuOpen?: (open: boolean) => void;
    hideMobileMenu?: boolean;
    className?: string;
}

export interface DashboardHeaderProps {
    children?: ReactNode;
    showNotifications?: boolean;
    showUserMenu?: boolean;
    userAvatar?: ReactNode;
    className?: string;
}
