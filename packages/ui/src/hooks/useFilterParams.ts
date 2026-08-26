import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export interface FilterConfig {
  key: string;
  defaultValue?: string;
  debounceMs?: number;
}

export interface UseFilterParamsOptions {
  filters: FilterConfig[];
}

export interface FilterState {
  [key: string]: string;
}

export interface FilterHandlers {
  [key: string]: (value: string) => void;
}

export interface UseFilterParamsReturn {
  filterValues: FilterState;
  setFilter: (key: string, value: string | null) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Custom hook to manage URL search parameters for filters
 *
 * @param options - Configuration object with filter definitions
 * @returns Object containing filter values, handlers, and utility functions
 *
 * @example
 * ```tsx
 * const { filterValues, setFilter, clearFilters, hasActiveFilters } = useFilterParams({
 *   filters: [
 *     { key: 'search', defaultValue: '', debounceMs: 400 },
 *     { key: 'holder', defaultValue: 'all' },
 *     { key: 'review', defaultValue: 'all' }
 *   ]
 * });
 * ```
 */
export function useFilterParams({
  filters,
}: UseFilterParamsOptions): UseFilterParamsReturn {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Initialize filter values from URL params
  const initialValues = filters.reduce((acc, filter) => {
    acc[filter.key] = params.get(filter.key) ?? filter.defaultValue ?? "";
    return acc;
  }, {} as FilterState);

  const [filterValues, setFilterValues] = useState<FilterState>(initialValues);
  const debounceRefs = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>(
    {},
  );

  /**
   * Update a URL parameter
   */
  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all" || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // Reset to first page when filters change
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  /**
   * Set a filter value with optional debouncing
   */
  const setFilter = (key: string, value: string | null) => {
    const filter = filters.find((f) => f.key === key);
    const debounceMs = filter?.debounceMs;

    if (debounceMs && debounceMs > 0) {
      // Update local state immediately for UI responsiveness
      setFilterValues((prev) => ({ ...prev, [key]: value ?? "" }));

      // Clear existing timeout
      if (debounceRefs.current[key]) {
        clearTimeout(debounceRefs.current[key]);
      }

      // Set new debounced update
      debounceRefs.current[key] = setTimeout(() => {
        updateParam(key, value);
      }, debounceMs);
    } else {
      // No debounce, update immediately
      updateParam(key, value);
    }
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    const next = new URLSearchParams(params.toString());

    // Clear all filter keys from URL
    filters.forEach((filter) => {
      next.delete(filter.key);
    });

    // Clear all debounce timers
    Object.values(debounceRefs.current).forEach((timeout) => {
      if (timeout) clearTimeout(timeout);
    });

    // Reset local state
    const resetValues = filters.reduce((acc, filter) => {
      acc[filter.key] = filter.defaultValue ?? "";
      return acc;
    }, {} as FilterState);
    setFilterValues(resetValues);

    router.push(`${pathname}?${next.toString()}`);
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = filters.some((filter) => {
    const value = params.get(filter.key);
    return value && value !== "all" && value !== "";
  });

  /**
   * Sync local state with URL params when they change externally
   */
  useEffect(() => {
    const newValues = filters.reduce((acc, filter) => {
      acc[filter.key] = params.get(filter.key) ?? filter.defaultValue ?? "";
      return acc;
    }, {} as FilterState);
    setFilterValues(newValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  /**
   * Cleanup debounce timers on unmount
   */
  useEffect(() => {
    const currentRefs = debounceRefs.current;
    return () => {
      Object.values(currentRefs).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  return {
    filterValues,
    setFilter,
    clearFilters,
    hasActiveFilters,
  };
}
