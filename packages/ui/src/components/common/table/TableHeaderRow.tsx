"use client";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { cn } from "@repo/ui/lib/utils";
import SortableHeaderLabel from "./SortableHeaderLabel";
import { SortDirection, TableHeaderRowProps } from "./TableHeaderRow.types";

/**
 * Maps a sort direction onto the aria-sort attribute value
 */
function getAriaSort(
  direction: SortDirection,
): "ascending" | "descending" | undefined {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return undefined;
}

/**
 * Generic table header row driven by an items array.
 *
 * Each item renders one header cell in one of three modes:
 * - plain label (default)
 * - checkbox, via `showCheckbox` — the item carries its own checked/disabled
 *   wiring, so a select-all column can sit anywhere in the row
 * - sort toggle, via `sortKey` — the active column and direction are row-level
 *   props, since only one column can be sorted at a time
 *
 * @example
 * ```tsx
 * <TableHeaderRow
 *   items={[
 *     {
 *       className: 'w-10',
 *       testId: USER_TABLE.SELECT_ALL_CHECKBOX,
 *       showCheckbox: true,
 *       checked: allSelected,
 *       indeterminate: someSelected,
 *       disabled: selectableIds.length === 0,
 *       ariaLabel: 'Select all users',
 *       onCheckedChange: handleSelectAll,
 *     },
 *     { label: 'Name', className: 'w-25', sortKey: 'name' },
 *     { label: 'Role', className: 'w-40' },
 *     { label: 'Actions', className: 'w-20' },
 *   ]}
 *   sortField={sortField}
 *   sortDirection={sortDirection}
 *   onSort={handleSort}
 * />
 * ```
 */
export default function TableHeaderRow<TSortField extends string = string>({
  items,
  className,
  testId,
  sortField,
  sortDirection,
  onSort,
}: TableHeaderRowProps<TSortField>) {
  return (
    <TableHeader className="[&_tr]:border-b-gray-200">
      <TableRow className={className} data-testid={testId}>
        {items.map((item, index) => {
          const isSortable = Boolean(item.sortKey);
          const direction: SortDirection =
            isSortable && item.sortKey === sortField
              ? (sortDirection ?? "none")
              : "none";

          return (
            <TableHead
              key={item.sortKey || item.label || `header-${index}`}
              scope="col"
              className={cn("text-[#6b7280]", item.className)}
              data-testid={item.showCheckbox ? undefined : item.testId}
              aria-sort={isSortable ? getAriaSort(direction) : undefined}
            >
              {item.showCheckbox ? (
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(checked) =>
                    item.onCheckedChange?.(!!checked)
                  }
                  disabled={item.disabled}
                  aria-label={item.ariaLabel}
                  data-testid={item.testId}
                  className={cn(
                    "cursor-pointer",
                    item.indeterminate && !item.checked
                      ? "data-[state=checked]:bg-primary"
                      : "",
                  )}
                />
              ) : isSortable ? (
                <SortableHeaderLabel
                  label={item.label ?? ""}
                  direction={direction}
                  onSort={() => onSort?.(item.sortKey as TSortField)}
                />
              ) : (
                item.label
              )}
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );
}
