"use client";

import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationData {
  limit: number;
  offset: number;
  totalItems: number;
  totalPages: number;
}

interface PaginationProps {
  pagination: PaginationData;
  length?: boolean;
  /** Test ids for the page-size select and the prev/next page buttons. */
  pageSizeTestId?: string;
  prevPageTestId?: string;
  nextPageTestId?: string;
}

function getPageRange(current: number, last: number): (number | "...")[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(last - 1, current + 1);

  if (rangeStart > 2) pages.push("...");

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < last - 1) pages.push("...");

  pages.push(last);

  return pages;
}

export default function PaginationSection({
  pagination,
  length,
  pageSizeTestId,
  prevPageTestId,
  nextPageTestId,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathName = usePathname();

  if (!pagination || !length) return null;

  const { limit, offset, totalItems, totalPages } = pagination;

  // Calculate current page from offset and limit
  const currentPage = Math.floor(offset / limit) + 1;

  const updateQueryParams = (newLimit?: number, newOffset?: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newLimit !== undefined) {
      params.set("limit", newLimit.toString());
    }
    if (newOffset !== undefined) {
      params.set("offset", newOffset.toString());
    }

    return `${pathName}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const newOffset = (page - 1) * limit;
    router.push(updateQueryParams(undefined, newOffset));
  };

  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value);
    // Reset to first page when changing limit
    router.push(updateQueryParams(newLimit, 0));
  };

  const startIndex = offset + 1;
  const endIndex = Math.min(offset + limit, totalItems);
  const pageRange = getPageRange(currentPage, totalPages);

  return (
    <nav aria-label="Table pagination" className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm" aria-live="polite" aria-atomic="true">
          Showing {startIndex}-{endIndex} of {totalItems} groups
        </span>
        <Select value={limit.toString()} onValueChange={handleLimitChange}>
          <SelectTrigger
            className="h-8 w-17.5"
            aria-label="Items per page"
            data-testid={pageSizeTestId}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1" role="group" aria-label="Page navigation">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            data-testid={prevPageTestId}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          {pageRange.map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="text-muted-foreground px-1 text-sm"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                className="h-8 w-8"
                onClick={() => handlePageChange(page)}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            data-testid={nextPageTestId}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </nav>
  );
}
