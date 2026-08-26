import React from "react";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface EmptySectionProps {
  length: number;
  searchParams?: SearchParams;
  emptyMessage: string;
  filteredMessage?: string;
}

export default async function EmptySection({
  length,
  searchParams,
  emptyMessage,
  filteredMessage,
}: EmptySectionProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const hasAnySearchParamValue = resolvedSearchParams
    ? Object.values(resolvedSearchParams).some((value) => {
        if (Array.isArray(value)) {
          return value.some((item) => item.trim().length > 0);
        }

        return typeof value === "string" && value.trim().length > 0;
      })
    : false;

  const showFilterMessage = hasAnySearchParamValue && length === 0;

  if (showFilterMessage) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        {filteredMessage}
      </div>
    );
  }

  if (!showFilterMessage && length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        {emptyMessage}
      </div>
    );
  }

  return null;
}
