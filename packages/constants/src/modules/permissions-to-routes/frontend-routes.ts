export interface RouteConfig {
  title: string;
  href: string;
  label: string;
  show: boolean;
  icon: string;
  group?: string;
  permission: string;
  disabled: boolean;
}

export interface SubRouteGroup {
  title: string;
  label: string;
  show: boolean;
  icon: string;
  children: Record<string, RouteConfig>;
}

import { PERMISSIONS } from "./permissions";

export const ROUTES = {
  USER: {
    WELCOME: {
      title: "Welcome",
      href: "/auth/welcome",
      label: "Welcome",
      show: false,
      icon: "LayoutDashboard",
      permission: PERMISSIONS.USER.READ_OWN_PROFILE,
      disabled: false,
    },
    DASHBOARD: {
      title: "Dashboard",
      href: "/dashboard",
      label: "Dashboard",
      show: true,
      icon: "LayoutDashboard",
      permission: PERMISSIONS.USER.READ_OWN_PROFILE,
      disabled: false,
    },
    PROFILE: {
      title: "Profile",
      href: "/profile",
      label: "Profile",
      show: true,
      icon: "User",
      permission: PERMISSIONS.USER.UPDATE_OWN_PROFILE,
      disabled: false,
    },
    SETTINGS: {
      title: "Settings",
      href: "/settings",
      label: "Settings",
      show: true,
      icon: "Settings",
      permission: PERMISSIONS.USER.UPDATE_OWN_PROFILE,
      disabled: false,
    },
  },
  ADMIN: {
    DASHBOARD: {
      title: "Dashboard",
      href: "/dashboard",
      label: "Dashboard",
      show: true,
      icon: "LayoutDashboard",
      permission: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      disabled: false,
    },
    USERS: {
      title: "Users",
      href: "/dashboard/users",
      label: "Users",
      show: true,
      icon: "Users",
      permission: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      disabled: false,
    },
    ROLES_AND_PERMISSIONS: {
      title: "Roles and Permissions",
      href: "/dashboard/roles-and-permissions",
      label: "Roles and Permissions",
      show: true,
      icon: "Shield",
      permission: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      disabled: false,
    },
    PERMISSIONS: {
      title: "Permissions",
      href: "/dashboard/permissions",
      label: "Permissions",
      show: true,
      icon: "ShieldCheck",
      permission: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      disabled: false,
    },
    AUDIT_LOGS: {
      title: "Audit Logs",
      href: "/dashboard/audit-logs",
      label: "Audit Logs",
      show: true,
      icon: "ClipboardList",
      permission: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      disabled: false,
    },
    SETTINGS: {
      title: "Settings",
      href: "/dashboard/settings",
      label: "Settings",
      show: true,
      icon: "Settings",
      permission: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      disabled: false,
    },
    SEO_SETTINGS: {
      title: "SEO Settings",
      href: "/dashboard/content/seo-settings",
      label: "SEO Settings",
      show: true,
      icon: "FileText",
      permission: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      disabled: false,
    },
    SEO_PAGES: {
      title: "SEO Pages",
      href: "/dashboard/content/seo-pages",
      label: "SEO Pages",
      show: true,
      icon: "FileText",
      permission: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      disabled: false,
    },
  },
} as const;

/**
 * Returns allowed route hrefs from a ROUTES section based on the user's permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllowedRoutes(
  routeSection: Record<string, any>,
  userPermissions: string[],
): string[] {
  return [
    ...new Set(
      Object.values(routeSection)
        .filter(
          (r) =>
            r != null &&
            typeof r === "object" &&
            "href" in r &&
            "permission" in r &&
            userPermissions.includes(r.permission),
        )
        .map((r) => r.href as string),
    ),
  ];
}
