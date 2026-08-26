type SortableColumnsMap<TColumn> = Record<string, TColumn>;

export const resolveSortableColumn = <TColumn>(
  sortField: string | undefined,
  sortableColumns: SortableColumnsMap<TColumn>,
  fallbackColumn: TColumn,
): TColumn => {
  if (!sortField) return fallbackColumn;
  if (!(sortField in sortableColumns)) return fallbackColumn;
  return sortableColumns[sortField];
};
