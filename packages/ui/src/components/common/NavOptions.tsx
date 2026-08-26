import { List, type LucideIcon, Settings, User } from "lucide-react";

export interface NavOptionItem {
  label: string;
  icon: LucideIcon;
  url: string;
}

/**
 * Returns role-based navigation options for the user dropdown menu.
 * Used by both frontend and admin apps. The starter ships SUPER_ADMIN/ADMIN/USER
 * — add a case per role as the project grows past that set.
 */
export const getNavOptions = ({ role }: { role: string }): NavOptionItem[] => {
  const userOptions: NavOptionItem[] = [
    {
      label: "Profile",
      icon: User,
      url: "/dashboard/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      url: "/dashboard/settings",
    },
  ];

  const adminOptions: NavOptionItem[] = [
    ...userOptions,
    {
      label: "Users",
      icon: List,
      url: "/dashboard/users",
    },
  ];

  switch (role) {
    case "user":
      return userOptions;
    case "admin":
    case "super_admin":
      return adminOptions;
    default:
      return [];
  }
};
