"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command";
import { stripHtmlToText } from "@repo/utilities/security/dom-purify";

export interface AutocompleteOption {
  id: string | null;
  name: string;
}

interface AutocompleteInputProps {
  id: string | null;
  label: string;
  description?: string;
  placeholder: string;
  value: string;
  onChange: (value: string, selectedId?: string | null) => void;
  maxLength: number;
  /** Debounced async lookup — decouples this component from any one app's fetch layer. */
  onSearch?: (query: string) => Promise<AutocompleteOption[]>;
  fallbackOptions?: AutocompleteOption[];
  error?: string;
  required?: boolean;
  inputTestId?: string;
  /** Normalized + prefixed per-option test id, e.g. `${prefix}${slug(option)}`. */
  optionTestIdPrefix?: string;
  /** Legacy single test id applied to every suggestion item (used when optionTestIdPrefix isn't provided). */
  suggestionTestId?: string;
  labelSize?: "sm" | "md" | "lg";
  /** 'used' -> "3/200"; 'remaining' -> "197 characters left". */
  counterStyle?: "used" | "remaining";
}

const normalizeAutocompleteTestIdPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EMPTY_OPTIONS: AutocompleteOption[] = [];

/**
 * Generic labeled-input-with-debounced-suggestions primitive: no profile or
 * app-specific logic. Callers own their own data fetching via `onSearch`.
 */
export default function AutocompleteInput({
  id,
  label,
  description,
  placeholder,
  value,
  onChange,
  maxLength,
  onSearch,
  fallbackOptions = EMPTY_OPTIONS,
  error,
  required = false,
  inputTestId,
  optionTestIdPrefix,
  suggestionTestId,
  labelSize = "md",
  counterStyle = "used",
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [fetchedOptions, setFetchedOptions] =
    useState<AutocompleteOption[] | null>(null);
  const options = fetchedOptions ?? fallbackOptions;
  const inputRef = useRef<HTMLInputElement>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOptions = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        if (!onSearch) {
          setFetchedOptions(null);
          return;
        }
        try {
          const results = await onSearch(query);
          if (Array.isArray(results)) {
            setFetchedOptions(results);
            return;
          }
          setFetchedOptions(null);
        } catch {
          setFetchedOptions(null);
        }
      }, 300);
    },
    [onSearch]
  );

  const filteredSuggestions = options.filter(
    opt =>
      opt.name.toLowerCase().includes(value.toLowerCase()) &&
      opt.name.toLowerCase() !== value.toLowerCase()
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id ?? undefined} className={`text-${labelSize}`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <Command shouldFilter={false} className="overflow-visible">
        <div className="relative">
          <Input
            ref={inputRef}
            id={id ?? undefined}
            data-testid={inputTestId}
            value={value}
            onChange={e => {
              const sanitized = stripHtmlToText(e.target.value);
              const newValue = sanitized.slice(0, maxLength);
              onChange(newValue, null);
              if (newValue.length > 0) {
                fetchOptions(newValue);
              }
              setOpen(newValue.length > 0);
            }}
            onFocus={() => {
              if (value.length > 0) {
                setOpen(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setOpen(false), 200);
            }}
            onKeyDown={e => {
              if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            autoComplete="off"
          />
          {open && filteredSuggestions.length > 0 && (
            <CommandList className="bg-popover border-border absolute z-506 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-md">
              <CommandGroup>
                {filteredSuggestions.map(opt => (
                  <CommandItem
                    key={opt.id ?? opt.name}
                    value={opt.name}
                    data-testid={
                      optionTestIdPrefix
                        ? `${optionTestIdPrefix}${normalizeAutocompleteTestIdPart(
                            opt.id ?? opt.name
                          )}`
                        : suggestionTestId
                    }
                    className="data-[selected=true]:bg-muted"
                    onSelect={() => {
                      onChange(opt.name, opt.id);
                      setOpen(false);
                      inputRef.current?.focus();
                    }}
                  >
                    {opt.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </div>
      </Command>
      <p className="text-muted-foreground text-right text-sm">
        {counterStyle === "remaining"
          ? `${maxLength - value.length} characters left`
          : `${value.length}/${maxLength}`}
      </p>
      {error && <p className="text-sm text-amber-500">{error}</p>}
    </div>
  );
}
