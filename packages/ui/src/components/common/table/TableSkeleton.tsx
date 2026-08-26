import { cn } from "@repo/ui/lib/utils";
import { TableSkeletonProps } from "./TableSkeleton.types";

/**
 * Generic TableSkeleton Component
 *
 * @description
 * A reusable skeleton loader for table views with configurable sections.
 * Shows loading states for header, filters, table, and pagination.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TableSkeleton />
 *
 * // Custom configuration
 * <TableSkeleton
 *   showHeader={true}
 *   showFilters={true}
 *   columnCount={12}
 *   rowCount={10}
 *   showPagination={true}
 * />
 * ```
 */
export default function TableSkeleton({
  showHeader = false,
  showFilters = true,
  filterCount = 3,
  columnCount = 12,
  rowCount = 5,
  showPagination = true,
  showBulkActions = false,
  className = "",
}: TableSkeletonProps) {
  return (
    <div
      className={cn("w-full max-w-full space-y-4 overflow-hidden", className)}
    >
      {/* Header Card Skeleton */}
      {showHeader && (
        <div className="bg-surface border-border w-full rounded-none border p-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-md bg-gray-200" />
          </div>
          <div className="mt-2 h-4 w-full max-w-full animate-pulse rounded bg-gray-100" />
          <div className="mt-1 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        </div>
      )}

      {/* Filter Section Skeleton */}
      {showFilters && (
        <div className="bg-surface border-border w-full rounded-none border p-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: filterCount }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 shrink-0 animate-pulse rounded-md bg-gray-200"
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions Skeleton */}
      {showBulkActions && (
        <div className="bg-muted flex items-center gap-4 rounded-lg p-3">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-300" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-gray-300" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-gray-300" />
        </div>
      )}

      {/* Table Section Skeleton */}
      <div className="bg-surface border-border w-full overflow-hidden rounded-none border">
        {/* Table Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-gray-200" />
            {Array.from({ length: columnCount }).map((_, i) => (
              <div
                key={i}
                className="h-5 min-w-20 flex-1 animate-pulse rounded bg-gray-200"
              />
            ))}
            <div className="h-5 w-16 shrink-0 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        {/* Table Rows */}
        {Array.from({ length: rowCount }).map((_, row) => (
          <div key={row} className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-4 overflow-x-auto">
              <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-gray-100" />
              {Array.from({ length: columnCount }).map((_, col) => (
                <div
                  key={col}
                  className="h-5 min-w-20 flex-1 animate-pulse rounded bg-gray-100"
                />
              ))}
              <div className="h-5 w-16 shrink-0 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Section Skeleton */}
      {showPagination && (
        <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-5 w-40 shrink-0 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-17.5 shrink-0 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 shrink-0 animate-pulse rounded bg-gray-200"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
