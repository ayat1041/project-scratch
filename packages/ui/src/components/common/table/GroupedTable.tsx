'use client';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import { Button } from '@repo/ui/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { GroupedTableProps } from './types';

/**
 * Generic GroupedTable component for displaying grouped data with actions
 *
 * @example
 * ```tsx
 * <GroupedTable
 *   data={groupedData}
 *   columns={columns}
 *   actions={actions}
 *   selectable
 *   selectedIds={selectedIds}
 *   onSelectChange={handleSelectOne}
 *   onSelectAll={handleSelectAll}
 *   getItemId={(item) => item.id}
 * />
 * ```
 */
export default function GroupedTable<TGroup = unknown, TItem = unknown>({
  data,
  columns,
  actions = [],
  selectable = false,
  selectedIds = new Set(),
  onSelectChange,
  onSelectAll,
  getItemId,
  isItemSelectable = () => true,
  className = '',
  showGroupHeader = true,
  alternateGroupColors = true,
  renderGroupHeader,
  renderActions,
}: GroupedTableProps<TGroup, TItem>) {
  // Calculate selection state for checkbox
  const selectableItems = data.flatMap(group =>
    group.items.filter(isItemSelectable).map(getItemId)
  );

  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every(id => selectedIds.has(id));

  const someSelected = selectableItems.some(id => selectedIds.has(id));

  return (
    <div
      className={cn('max-w-full overflow-x-auto rounded-md border', className)}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  disabled={selectableItems.length === 0}
                  className={cn(
                    'cursor-pointer',
                    someSelected && !allSelected
                      ? 'data-[state=checked]:bg-primary'
                      : ''
                  )}
                />
              </TableHead>
            )}

            {columns.map(column => (
              <TableHead
                key={column.key}
                className={cn('text-[#6b7280]', column.className)}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </TableHead>
            ))}

            {(actions.length > 0 || renderActions) && (
              <TableHead className="w-40 text-[#6b7280]">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((group, groupIndex) => {
            const isEvenGroup = groupIndex % 2 === 0;
            const groupBg = alternateGroupColors
              ? isEvenGroup
                ? 'bg-background'
                : 'bg-muted/30'
              : 'bg-background';
            const accentColor = alternateGroupColors
              ? isEvenGroup
                ? 'border-l-primary'
                : 'border-l-primary/50'
              : 'border-l-primary';

            return (
              <React.Fragment key={group.groupKey}>
                {/* Group Header Row */}
                {showGroupHeader && (
                  <TableRow className={`${groupBg} hover:bg-accent/30`}>
                    <TableCell
                      className={`border-t border-l-4 py-3 ${accentColor}`}
                      colSpan={
                        columns.length +
                        (selectable ? 1 : 0) +
                        (actions.length > 0 || renderActions ? 1 : 0)
                      }
                    >
                      {renderGroupHeader
                        ? renderGroupHeader(group, groupIndex)
                        : group.groupLabel}
                    </TableCell>
                  </TableRow>
                )}

                {/* Item Rows */}
                {group.items.map((item, itemIndex) => {
                  const itemId = getItemId(item);
                  const isSelectable = isItemSelectable(item);
                  const isSelected = selectedIds.has(itemId);
                  const visibleActions = actions.filter(
                    action => !action.show || action.show(item)
                  );

                  return (
                    <TableRow
                      key={`${group.groupKey}-${itemIndex}`}
                      className={`${groupBg} hover:bg-accent/50`}
                    >
                      {selectable && (
                        <TableCell>
                          {isSelectable && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={checked =>
                                onSelectChange?.(itemId, !!checked)
                              }
                              className="cursor-pointer"
                            />
                          )}
                        </TableCell>
                      )}

                      {columns.map(column => (
                        <TableCell
                          key={column.key}
                          className={column.className}
                        >
                          {column.render
                            ? (column.render(
                                item,
                                group.groupData
                              ) as React.ReactNode)
                            : String(
                                (item as Record<string, unknown>)[column.key] ??
                                  ''
                              )}
                        </TableCell>
                      ))}

                      {/* Actions Column */}
                      {(visibleActions.length > 0 || renderActions) && (
                        <TableCell>
                          {renderActions ? (
                            renderActions(item)
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {visibleActions.map((action, index) => (
                                  <React.Fragment key={index}>
                                    {index > 0 &&
                                      action.variant === 'destructive' &&
                                      visibleActions[index - 1]?.variant !==
                                        'destructive' && (
                                        <DropdownMenuSeparator />
                                      )}
                                    <DropdownMenuItem
                                      onClick={() => action.onClick(item)}
                                      className={
                                        action.variant === 'destructive'
                                          ? 'text-destructive'
                                          : ''
                                      }
                                    >
                                      {action.icon}
                                      {action.label}
                                    </DropdownMenuItem>
                                  </React.Fragment>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
