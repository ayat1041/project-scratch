"use client";

import { cn } from "../../lib/utils";
import SectionContainer from "../containers/SectionContainer";
import AuthLogo from "./AuthLogo";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { type ReactNode } from "react";

export interface AppHeaderProps {
  /** 'public' renders a full navbar with logo; 'dashboard' renders a minimal top strip */
  variant?: "public" | "dashboard";
  /** Routes where the header should be completely hidden */
  hiddenPaths?: string[];
  /** Where the logo links to (public variant only, default '/') */
  logoHref?: string;
  /** Right-side content (nav actions, avatar, notifications, etc.) */
  children?: ReactNode;
  /** Additional CSS classes for the nav element */
  className?: string;
}

export default function AppHeader({
  variant = "public",
  hiddenPaths,
  logoHref = "/",
  children,
  className,
}: AppHeaderProps) {
  const path = usePathname();

  if (hiddenPaths?.some((route) => path?.startsWith(route))) {
    return null;
  }

  if (variant === "dashboard") {
    return (
      <div className="relative w-full">
        <nav
          className={cn(
            "border-border fixed top-0 right-0 left-0 z-50 flex h-16 w-full items-center justify-end border-b bg-white px-6",
            className,
          )}
        >
          <div className="flex items-center gap-2">{children}</div>
        </nav>
        <div className="mt-14 inline-block"></div>
      </div>
    );
  }

  return (
    <header>
      <div className="relative z-[500] w-full">
        <nav
          className={cn(
            "fixed top-0 right-0 left-0 z-50 w-full bg-white shadow-md",
            className,
          )}
        >
          <SectionContainer className="py-0 md:py-0">
            <div className="flex h-16 items-center justify-between">
              <div className="flex-shrink-0">
                <Link href={logoHref}>
                  <AuthLogo className="h-[32px] w-[140px]" />
                </Link>
              </div>
              <div className="flex items-center gap-2.5">{children}</div>
            </div>
          </SectionContainer>
        </nav>
        <div className="mt-14 inline-block"></div>
      </div>
    </header>
  );
}
