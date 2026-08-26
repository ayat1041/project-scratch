"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { NavLink } from "../wrappers/NavLink";
import { DashboardSidebarProps } from "./types";

export default function DashboardSidebar({
  navItems,
  logoText,
  logoHref = "/",
  collapsed = false,
  onToggle,
  mobileMenuOpen = false,
  setMobileMenuOpen,
  hideMobileMenu = false,
  className,
}: DashboardSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Initialize open sections based on active route
  useEffect(() => {
    const initialOpenSections: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.subItems) {
        const isActive = item.subItems.some(
          (sub) => pathname === sub.url || pathname.startsWith(sub.url + "/"),
        );
        initialOpenSections[item.title] = isActive;
      }
    });
    setOpenSections(initialOpenSections);
  }, [pathname, navItems]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const getBadge = (count?: number) => {
    if (!count || count === 0) return null;
    return (
      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const getCollapsedBadge = (count?: number) => {
    if (!count || count === 0) return null;
    return (
      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground">
        {count > 9 ? "9+" : count}
      </span>
    );
  };

  const renderNavItem = (item: (typeof navItems)[0]) => {
    // Handle items with sub-navigation
    if (item.subItems) {
      const isActive = item.subItems.some(
        (sub) => pathname === sub.url || pathname.startsWith(sub.url + "/"),
      );
      const isOpen = openSections[item.title];

      if (collapsed) {
        // Collapsed view: show icon with tooltip listing sub-items
        return (
          <TooltipProvider key={item.title}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.subItems?.[0]?.url || "#"}
                  className={cn(
                    "flex items-center justify-center p-2.5 rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground relative",
                    isActive &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                  suppressHydrationWarning
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {getCollapsedBadge(item.badge)}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-popover text-popover-foreground border border-border"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{item.title}</span>
                  <div className="border-t border-border my-1" />
                  {item.subItems.map((sub) => (
                    <NavLink
                      key={sub.title}
                      to={sub.url}
                      className="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-accent"
                    >
                      <sub.icon className="h-3 w-3" />
                      {sub.title}
                      {sub.badge ? (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {sub.badge > 99 ? "99+" : sub.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      // Expanded view: show collapsible section
      return (
        <Collapsible
          key={item.title}
          open={isOpen}
          onOpenChange={() => toggleSection(item.title)}
        >
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full",
                isActive && "text-foreground",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="flex-1 text-left">{item.title}</span>
              {getBadge(item.badge)}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {item.subItems.map((sub) => (
              <NavLink
                key={sub.title}
                to={sub.url}
                className="flex items-center gap-3 pl-8 pr-3 py-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                suppressHydrationWarning
              >
                <sub.icon className="h-[18px] w-[18px]" />
                <span>{sub.title}</span>
                {getBadge(sub.badge)}
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    // Regular nav items (no sub-items)
    if (collapsed) {
      return (
        <TooltipProvider key={item.title}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.url!}
                className="flex items-center justify-center p-2.5 rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground relative"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                suppressHydrationWarning
              >
                <item.icon className="h-[18px] w-[18px]" />
                {getCollapsedBadge(item.badge)}
              </NavLink>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-popover text-popover-foreground border border-border"
            >
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <NavLink
        key={item.title}
        to={item.url!}
        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        activeClassName="bg-primary text-primary-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
        suppressHydrationWarning
      >
        <item.icon className="h-[18px] w-[18px]" />
        <span>{item.title}</span>
        {getBadge(item.badge)}
      </NavLink>
    );
  };

  // Close mobile menu on route change
  useEffect(() => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname, setMobileMenuOpen]);

  // Handle click outside for mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        mobileMenuOpen &&
        setMobileMenuOpen
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  const toggleMobileMenu = () => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(!mobileMenuOpen);
    }
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      {!hideMobileMenu && (
        <button
          title="menu"
          onClick={toggleMobileMenu}
          className="fixed top-[12px] left-4 z-[999] block rounded-md bg-transparent p-2 text-muted-foreground transition-all duration-200 hover:bg-muted focus:outline-none md:hidden"
        >
          <LayoutDashboard className="h-6 w-6" />
        </button>
      )}

      {/* Mobile Sidebar (Hamburger) */}
      {!hideMobileMenu && (
        <div
          ref={sidebarRef}
          className={cn(
            "fixed top-0 left-0 z-[1000] h-screen w-64 transform bg-sidebar-background shadow-lg transition-transform duration-300 ease-in-out md:hidden",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col">
            {/* Mobile Header */}
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Link
                href={logoHref}
                className="text-base font-semibold text-foreground"
                onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
              >
                {logoText}
              </Link>
              <button
                title="close-menu"
                onClick={toggleMobileMenu}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted focus:outline-none"
                aria-label="sidebar close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-3">
                {navItems.map((item) => {
                  // Mobile: render with subItems expanded
                  if (item.subItems) {
                    return (
                      <li key={item.title}>
                        <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground">
                          <item.icon className="h-[18px] w-[18px]" />
                          <span>{item.title}</span>
                          {getBadge(item.badge)}
                        </div>
                        <ul className="space-y-1 mt-1">
                          {item.subItems.map((sub) => (
                            <li key={sub.title}>
                              <NavLink
                                to={sub.url}
                                className="text-md hover:text-secondary flex items-center gap-3 rounded-lg pl-8 pr-3 py-2 font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:font-semibold"
                                activeClassName="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              >
                                <sub.icon className="h-[18px] w-[18px]" />
                                <span>{sub.title}</span>
                                {getBadge(sub.badge)}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  }
                  return (
                    <li key={item.title}>
                      <NavLink
                        to={item.url!}
                        className="text-md hover:text-secondary flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:font-semibold"
                        activeClassName="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      >
                        <item.icon className="h-[18px] w-[18px]" />
                        <span>{item.title}</span>
                        {getBadge(item.badge)}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop/Tablet Sidebar */}
      <aside
        className={cn(
          "relative z-[501] hidden min-h-screen flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300 md:flex",
          collapsed ? "w-[68px]" : "w-[220px]",
          className,
        )}
      >
        <div
          className={cn(
            "fixed transition-all duration-300",
            collapsed ? "w-[68px]" : "w-[220px]",
          )}
        >
          {/* Logo Area */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            {!collapsed && (
              <Link
                href={logoHref}
                className="text-foreground text-lg font-semibold"
              >
                {logoText}
              </Link>
            )}
            {onToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                aria-label="sidebar close menu"
                className="text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4" suppressHydrationWarning>
            <ul className="space-y-1 px-3">
              {navItems.map((item) => (
                <li key={item.title} suppressHydrationWarning>
                  {renderNavItem(item)}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
