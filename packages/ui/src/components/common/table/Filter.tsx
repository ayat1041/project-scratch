"use client";
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Button } from "@repo/ui/components/ui/button";

import { cn } from "@repo/ui/lib/utils";
import { stripHtmlToText } from "@repo/utilities/security/dom-purify";
import { useFilterParams } from "../../../hooks/useFilterParams";

/**
 * Maximum number of characters allowed in a search input.
 * Mirrors the backend search query limit of 100 characters.
 */
const SEARCH_MAX_LENGTH = 100;

/**
 * Generic Filter Component for tables
 *
 * @description
 * A reusable filter component that handles search inputs and select dropdowns with URL parameter management.
 * Automatically syncs filter state with URL query parameters and provides clear filters functionality.
 *
 * @example
 * ```tsx
 * <Filter
 *   fields={[
 *     {
 *       type: 'search',
 *       key: 'search',
 *       placeholder: 'Search users...',
 *       debounceMs: 400
 *     },
 *     {
 *       type: 'select',
 *       key: 'role',
 *       placeholder: 'Role',
 *       options: [
 *         { label: 'all', value: 'all', count: 100 },
 *         { label: 'admin', value: 'admin', count: 10 },
 *         { label: 'user', value: 'user', count: 90 }
 *       ]
 *     }
 *   ]}
 * />
 * ```
 */
export default function Filter({
  fields,
  className,
  alwaysShowClear = false,
  isClearFilterShow = true,
  clearTestId,
}: FilterProps) {
  // Build filter configuration for the hook
  const filterConfigs = fields.map((field) => ({
    key: field.key,
    defaultValue: field.defaultValue ?? (field.type === "select" ? "all" : ""),
    debounceMs: field.type === "search" ? (field.debounceMs ?? 0) : 0,
  }));

  const { filterValues, setFilter, clearFilters, hasActiveFilters } =
    useFilterParams({
      filters: filterConfigs,
    });

  /**
   * Render a search input field
   */
  const renderSearchField = (field: FilterField) => {
    if (field.type !== "search") return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = stripHtmlToText(e.target.value).slice(
        0,
        SEARCH_MAX_LENGTH,
      );
      setFilter(field.key, sanitizedValue || null);
    };

    return (
      <div key={field.key} className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
        <Input
          placeholder={field.placeholder}
          value={filterValues[field.key] || ""}
          onChange={handleChange}
          maxLength={SEARCH_MAX_LENGTH}
          className={cn("w-50 pl-9", field.className)}
          data-testid={field.testId}
          aria-label={field.placeholder}
        />
      </div>
    );
  };

  /**
   * Render a select dropdown field
   */
  const renderSelectField = (field: FilterField) => {
    if (field.type !== "select") return null;
    if (!field.options || field.options.length === 0) return null;

    const handleChange = (val: string) => {
      setFilter(field.key, val);
    };

    const optionTestIdPrefix =
      field.optionTestIdPrefix ??
      (field.testId ? `${field.testId}-` : undefined);

    return (
      <Select
        key={field.key}
        value={filterValues[field.key] || field.defaultValue || "all"}
        onValueChange={handleChange}
      >
        {/* Radix's `Select` root renders no DOM node of its own, so the test
            id has to sit on the trigger to be queryable. */}
        <SelectTrigger
          className="w-50"
          aria-label={field.placeholder}
          data-testid={field.testId}
        >
          <SelectValue placeholder={field.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              data-testid={
                optionTestIdPrefix
                  ? `${optionTestIdPrefix}${option.value}`
                  : undefined
              }
            >
              {option.label}
              {option.count !== undefined && ` (${option.count})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {fields.map((field) => {
        if (field.type === "search") {
          return renderSearchField(field);
        }
        return renderSelectField(field);
      })}

      {isClearFilterShow && (hasActiveFilters || alwaysShowClear) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          data-testid={clearTestId}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SelectFilterField {
  type: "select";
  key: string;
  placeholder: string;
  options: FilterOption[];
  defaultValue?: string;
  /** Test id for the select trigger. */
  testId?: string;
  /**
   * Prefix for each option's test id — the option value is appended to it.
   * Defaults to `<testId>-`, which is rarely what a spec expects when the
   * trigger id ends in `-trigger`.
   */
  optionTestIdPrefix?: string;
}

export interface SearchFilterField {
  type: "search";
  key: string;
  placeholder: string;
  defaultValue?: string;
  debounceMs?: number;
  className?: string;
  testId?: string;
}

export type FilterField = SelectFilterField | SearchFilterField;

export interface FilterProps {
  /**
   * Array of filter field configurations
   */
  fields: FilterField[];

  /**
   * Test ID for the clear filters button
   */
  clearTestId?: string;

  /**
   * Optional custom class name for the filter container
   */
  className?: string;

  /**
   * Show clear filters button even when no filters are active
   */
  alwaysShowClear?: boolean;

  /**
   * Whether the clear filters button can be rendered at all.
   * Defaults to `true`; pass `false` to never render it.
   */
  isClearFilterShow?: boolean;
}
