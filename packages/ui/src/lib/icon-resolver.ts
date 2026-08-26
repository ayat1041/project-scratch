import {
    LayoutDashboard,
    Building2,
    Users,
    DollarSign,
    FileText,
    BarChart3,
    ChartColumn,
    Settings,
    User,
    Briefcase,
    Layers,
    BadgeCheck,
    ShieldCheck,
    Shield,
    ScrollText,
    FileCheck,
    Trophy,
    Bell,
    Award,
    ClipboardList,
    type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
    LayoutDashboard,
    Building2,
    Users,
    DollarSign,
    FileText,
    BarChart3,
    ChartColumn,
    Settings,
    User,
    Briefcase,
    Layers,
    BadgeCheck,
    ShieldCheck,
    Shield,
    ScrollText,
    FileCheck,
    Trophy,
    Bell,
    Award,
    ClipboardList,
};

/**
 * Resolves a string icon name to a lucide-react component.
 * Falls back to LayoutDashboard if the icon name is not found.
 */
export function resolveIcon(name: string): LucideIcon {
    return ICON_MAP[name] || LayoutDashboard;
}
