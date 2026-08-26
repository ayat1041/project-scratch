"use client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, LogOut, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface NavOptionItem {
  label: string;
  icon: LucideIcon;
  url: string;
}

export interface UserAvatarUserInfo {
  userName?: string | null;
  email?: string | null;
  profileImage?: string | null;
}

export interface UserAvatarProps {
  userInfo: UserAvatarUserInfo | null;
  menuItems: NavOptionItem[];
  onLogout: () => void;
  dropdownLabel?: string;
}

const UserAvatar = ({
  userInfo,
  menuItems,
  onLogout,
  dropdownLabel = "My Account",
}: UserAvatarProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          data-testid="user-avatar-trigger"
          className="hover:bg-accent hover:text-accent-foreground flex h-auto cursor-pointer items-center gap-2 px-2 py-1 transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={userInfo?.profileImage || ""}
              alt={userInfo?.userName || "User"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {userInfo?.userName ? userInfo.userName.charAt(0) : "U"}
            </AvatarFallback>
          </Avatar>

          <div className="hidden flex-col items-start md:flex">
            <span className="text-foreground text-sm font-medium">
              {userInfo?.userName || userInfo?.email || "User"}
            </span>
            <span className="text-muted-foreground text-xs">
              {userInfo?.email}
            </span>
          </div>
          <ChevronDown className="text-muted-foreground hidden h-4 w-4 md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-border bg-popover z-501 w-56 border"
      >
        <DropdownMenuLabel className="text-foreground">
          {dropdownLabel}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((opt) => {
          const IconComponent = opt.icon;
          return (
            <DropdownMenuItem key={opt.label} asChild>
              <Link href={opt.url} className="cursor-pointer">
                <IconComponent className="mr-2 h-4 w-4" />
                <span>{opt.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatar;
