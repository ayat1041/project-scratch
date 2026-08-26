import { ReactNode } from 'react';

/**
 * Column configuration for tables
 */
export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T, group?: unknown) => ReactNode;
  className?: string;
}

/**
 * Configuration for grouped table data
 */
export interface GroupedTableData<TGroup = unknown, TItem = unknown> {
  groupKey: string | number;
  groupLabel: ReactNode;
  items: TItem[];
  groupData?: TGroup;
}

/**
 * Action configuration for table rows
 */
export interface TableAction<T = unknown> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'ghost';
  show?: (item: T) => boolean;
}

/**
 * Props for GroupedTable component
 */
export interface GroupedTableProps<TGroup = unknown, TItem = unknown> {
  data: GroupedTableData<TGroup, TItem>[];
  columns: TableColumn<TItem>[];
  actions?: TableAction<TItem>[];
  
  // Selection props
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectChange?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  getItemId: (item: TItem) => string;
  isItemSelectable?: (item: TItem) => boolean;
  
  // Styling
  className?: string;
  showGroupHeader?: boolean;
  alternateGroupColors?: boolean;
  
  // Custom renderers
  renderGroupHeader?: (group: GroupedTableData<TGroup, TItem>, index: number) => ReactNode;
  renderActions?: (item: TItem) => ReactNode;
}
