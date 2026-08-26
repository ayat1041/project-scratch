"use client";
import * as React from "react";

import { cn } from "../../lib/utils";
import { encodeHtmlSafe } from "@repo/utilities/security/dom-purify";

interface InputProps extends React.ComponentProps<"input"> {
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, type, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const encoded = encodeHtmlSafe(e.target.value);
      if (encoded !== e.target.value) {
        e.target.value = encoded;
      }

      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div
        className={cn(
          "rounded transition-all duration-200 w-full",
          "ring-2 ring-transparent ring-offset-2 ring-offset-transparent",
          "has-[:focus]:ring-primary has-[:focus]:ring-offset-background",
          "has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-background",
          "hover:ring-muted-foreground/0",
          wrapperClassName,
        )}
      >
        <input
          type={type}
          className={cn(
            "border-border bg-input text-foreground flex h-12 w-full rounded border px-4 py-3 text-sm",
            "placeholder:text-muted-foreground",
            "focus:border-primary focus-visible:border-primary focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:border-muted-foreground/50",
            className,
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
