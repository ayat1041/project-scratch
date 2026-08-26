import { resolveIcon } from "../../lib/icon-resolver";
import type { NavItem, SubNavItem } from "./types";

interface RouteEntry {
    title: string;
    href: string;
    label: string;
    show: boolean;
    icon: string;
    group?: string;
    disabled?: boolean;
}

interface SidebarGroupMeta {
    icon: string;
}

/**
 * Converts a flat ROUTES section (e.g. ROUTES.ADMIN) into NavItem[]
 * for use with DashboardSidebar component.
 *
 * - Only includes routes where `show: true`
 * - Supports URL overrides (e.g. dynamic profile URLs)
 * - Groups admin routes by `group` field into collapsible sub-nav
 */
export function buildNavItems(
    routes: Record<string, RouteEntry>,
    options?: {
        urlOverrides?: Record<string, string>;
        sidebarGroups?: Record<string, SidebarGroupMeta>;
    }
): NavItem[] {
    const { urlOverrides = {}, sidebarGroups = {} } = options || {};
    const navItems: NavItem[] = [];
    const groupMap = new Map<string, SubNavItem[]>();
    // Track placeholder index for each group so it appears at its first occurrence
    const groupIndex = new Map<string, number>();

    for (const [key, route] of Object.entries(routes)) {
        if (!route.show || route.disabled) continue;

        const url = urlOverrides[key] || route.href;
        const icon = resolveIcon(route.icon);

        if (route.group) {
            // On first encounter, insert a placeholder at the current position
            if (!groupMap.has(route.group)) {
                groupMap.set(route.group, []);
                groupIndex.set(route.group, navItems.length);
                // Insert placeholder that will be replaced below
                navItems.push(null as unknown as NavItem);
            }
            groupMap.get(route.group)!.push({
                title: route.title,
                url,
                icon,
            });
        } else {
            // Top-level nav item
            navItems.push({
                title: route.title,
                url,
                icon,
            });
        }
    }

    // Replace placeholders with fully-built group items
    for (const [groupName, idx] of groupIndex.entries()) {
        const groupMeta = sidebarGroups[groupName];
        const groupIcon = groupMeta ? resolveIcon(groupMeta.icon) : resolveIcon("BadgeCheck");

        navItems[idx] = {
            title: groupName,
            icon: groupIcon,
            subItems: groupMap.get(groupName)!,
        };
    }

    return navItems;
}
