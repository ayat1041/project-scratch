import * as React from "react";

import { cn } from "../../lib/utils";
import { encodeHtmlSafe } from "@repo/utilities/security/dom-purify";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    showCount?: boolean;
    maxLength?: number;
    wrapperClassName?: string;
  };

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      wrapperClassName,
      showCount = false,
      maxLength,
      onChange,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const encoded = encodeHtmlSafe(e.target.value);
      if (encoded !== e.target.value) {
        e.target.value = encoded;
      }

      if (onChange) {
        onChange(e);
      }
    };

    return (
      <>
        <div
          className={cn(
            "rounded transition-all duration-200 w-full",
            "ring-2 ring-transparent ring-offset-2 ring-offset-transparent",
            "has-[:focus]:ring-primary has-[:focus]:ring-offset-white",
            "has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-white",
            "hover:ring-muted-foreground/0",
            wrapperClassName,
          )}
        >
          <textarea
            className={cn(
              "border-border bg-input text-foreground flex min-h-[80px] w-full resize-y rounded border px-4 py-3 text-sm",
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
        {showCount && maxLength && (
          <div className="text-xs text-muted-foreground mt-1 ml-auto w-fit">
            {props.value?.toString().length || 0}/{maxLength}
          </div>
        )}
      </>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
