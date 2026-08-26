/**
 * Sort direction for a table column.
 * `none` means the column is unsorted — either nothing is sorted, or another
 * column is the active one.
 */
export type SortDirection = 'asc' | 'desc' | 'none';

/**
 * Configuration for a single header cell in a TableHeaderRow
 */
export interface TableHeaderItem<TSortField extends string = string> {
  /**
   * Text rendered inside the header cell.
   * Ignored when `showCheckbox` is true.
   */
  label?: string;

  /**
   * Custom className merged onto the header cell (e.g. `w-10`, `w-20`)
   */
  className?: string;

  /**
   * data-testid applied to the header cell, or to the checkbox
   * when `showCheckbox` is true
   */
  testId?: string;

  /**
   * Render a checkbox in this cell instead of the label
   */
  showCheckbox?: boolean;

  /**
   * Checked state of the checkbox. Only read when `showCheckbox` is true.
   */
  checked?: boolean;

  /**
   * Partial-selection state — highlights the checkbox while not fully checked.
   * Only read when `showCheckbox` is true.
   */
  indeterminate?: boolean;

  /**
   * Disables the checkbox. Only read when `showCheckbox` is true.
   */
  disabled?: boolean;

  /**
   * aria-label for the checkbox. Only read when `showCheckbox` is true.
   */
  ariaLabel?: string;

  /**
   * Called when the checkbox is toggled. Only read when `showCheckbox` is true.
   */
  onCheckedChange?: (checked: boolean) => void;

  /**
   * Makes this column sortable, identifying it to the row's `onSort` callback.
   * The active column and its direction are row-level state — see
   * `TableHeaderRowProps.sortField` / `sortDirection`.
   */
  sortKey?: TSortField;
}

/**
 * Props for the TableHeaderRow component
 */
export interface TableHeaderRowProps<TSortField extends string = string> {
  /**
   * Header cells rendered left to right
   */
  items: TableHeaderItem<TSortField>[];

  /**
   * Custom className for the header row
   */
  className?: string;

  /**
   * data-testid applied to the header row
   */
  testId?: string;

  /**
   * The currently sorted column. Only the item whose `sortKey` matches renders
   * a direction arrow; every other sortable column renders as unsorted.
   * Required only when at least one item has a `sortKey`.
   */
  sortField?: TSortField | null;

  /**
   * Direction of the active sort. `null`/`undefined` are treated as `none`.
   */
  sortDirection?: SortDirection | null;

  /**
   * Called with the `sortKey` of the column the user activated
   */
  onSort?: (field: TSortField) => void;
}
