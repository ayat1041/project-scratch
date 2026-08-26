"use client";

import { cn } from "../../lib/utils";
import { DashboardHeaderProps } from "./types";

export default function DashboardHeader({
  children,
  className,
}: DashboardHeaderProps) {
  return (
    <div className="relative w-full">
      <nav
        className={cn(
          "border-border fixed top-0 right-0 left-0 z-50 flex h-16 w-full items-center justify-end border-b bg-background px-6",
          className,
        )}
      >
        <div className="flex items-center gap-2">{children}</div>
      </nav>
      <div className="mt-14 inline-block"></div>
    </div>
  );
}
