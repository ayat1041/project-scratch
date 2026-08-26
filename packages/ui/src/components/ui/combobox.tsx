"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ComboboxItem = {
  value: string;
  label: string;
  disabled?: boolean;
  testId?: string;
  /** Optional custom render for the item in the dropdown list */
  renderLabel?: React.ReactNode;
};

interface ComboboxProps {
  value: string;
  onChange: (nextValue: string) => void;
  items: ComboboxItem[];
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  /** Allow users to type a custom value not present in the list. */
  allowCustomValue?: boolean;
  /** Max length allowed for a custom value (defaults to 100). */
  customValueMaxLength?: number;
  triggerTestId?: string;
  searchInputTestId?: string;
  customOptionTestId?: string;
  className?: string;
}

function Combobox({
  value,
  onChange,
  items,
  onSearchChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  loadingText = "Loading...",
  isLoading = false,
  disabled,
  allowCustomValue = false,
  customValueMaxLength = 100,
  triggerTestId,
  searchInputTestId,
  customOptionTestId,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selectedLabel = React.useMemo(
    () => items.find((i) => i.value === value)?.label,
    [items, value],
  );

  const displayValue = React.useMemo(() => {
    if (selectedLabel) return selectedLabel;
    if (allowCustomValue && value) return value;
    return undefined;
  }, [allowCustomValue, selectedLabel, value]);

  const normalizedQuery = React.useMemo(
    () => query.trim().slice(0, customValueMaxLength),
    [customValueMaxLength, query],
  );

  const hasExactMatch = React.useMemo(() => {
    if (!normalizedQuery) return false;
    const q = normalizedQuery.toLowerCase();
    return items.some(
      (i) => i.label.toLowerCase() === q || i.value.toLowerCase() === q,
    );
  }, [items, normalizedQuery]);

  const showCreateOption =
    allowCustomValue && Boolean(normalizedQuery) && !hasExactMatch;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          onSearchChange?.("");
          return;
        }

        setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-testid={triggerTestId}
          className={cn(
            "relative h-auto min-h-12 w-full justify-between whitespace-normal rounded px-3 py-2 pr-10 text-left",
            className,
          )}
        >
          <span
            className={cn(
              "min-w-0 break-words pr-2 text-left whitespace-normal",
              !displayValue && "text-muted-foreground",
            )}
          >
            {displayValue ?? placeholder}
          </span>
          <ChevronsUpDown className="absolute right-3 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="pointer-events-auto p-0"
        style={{ maxWidth: "var(--radix-popover-trigger-width)" }}
        align="start"
        onWheelCapture={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            data-testid={searchInputTestId}
            onValueChange={(v) => {
              setQuery(v);
              onSearchChange?.(v);
            }}
          />
          <CommandList className="pointer-events-auto overscroll-contain">
            <CommandEmpty>{isLoading ? loadingText : emptyText}</CommandEmpty>
            <CommandGroup>
              {showCreateOption && (
                <CommandItem
                  className="items-start"
                  value={normalizedQuery}
                  data-testid={customOptionTestId}
                  onSelect={() => {
                    onChange(normalizedQuery);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 mt-0.5 h-4 w-4 self-start",
                      value === normalizedQuery ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1 break-words whitespace-normal">
                    Use &ldquo;{normalizedQuery}&rdquo;
                  </span>
                </CommandItem>
              )}
              {items.map((item) => (
                <CommandItem
                  className="items-start"
                  key={item.value}
                  value={item.label}
                  disabled={item.disabled}
                  data-testid={item.testId}
                  onSelect={() => {
                    if (item.disabled) return;
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 mt-0.5 h-4 w-4 self-start",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1 break-words whitespace-normal">
                    {item.renderLabel ?? item.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
export type { ComboboxProps };
