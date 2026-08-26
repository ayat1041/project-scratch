import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import React from "react";

import type { ButtonHTMLAttributes } from "react";

interface ArrowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string | React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const ArrowButton: React.FC<ArrowButtonProps> = ({
  className,
  label = "Get started now",
  icon,
  isLoading = false,
  ...props
}) => {
  return (
    <Button
      variant={"default"}
      className={cn(
        "flex cursor-pointer items-center justify-center gap-2.5 px-10 py-2.5 hover:opacity-90",
        "border-gradient-border rounded-[100px] border",
        "bg-primary",
        "shadow-[0_7px_33px_0_rgba(0,4,28,0.20)]",
        "text-md font-semibold md:text-base",
        className,
      )}
      {...props}
    >
      {isLoading && (
        <svg
          className="text-background-card mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
      )}
      {label} {icon}
    </Button>
  );
};

export default ArrowButton;
