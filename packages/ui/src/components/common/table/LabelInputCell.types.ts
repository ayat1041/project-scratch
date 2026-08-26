/**
 * Badge configuration for the label input cell
 */
export interface LabelBadge {
  /**
   * Badge text to display
   */
  text: string;
  /**
   * Badge variant
   */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /**
   * Custom className for badge styling
   */
  className?: string;
}

/**
 * Props for the LabelInputCell component
 */
export interface LabelInputCellProps<TItem> {
  /**
   * The item/record being edited
   */
  item: TItem;

  /**
   * Function to extract the current label from the item
   */
  getLabel: (item: TItem) => string | null | undefined;

  /**
   * Function to extract the unique identifier from the item
   */
  getId: (item: TItem) => string;

  /**
   * Function to determine if editing should be disabled
   */
  isDisabled: (item: TItem) => boolean;

  /**
   * Custom validation function for the label
   * Returns error message if invalid, null if valid
   */
  validateLabel: (label: string, item: TItem) => string | null;

  /**
   * Function to save the label
   * Returns true if successful, false otherwise
   */
  onSave: (itemId: string, newLabel: string) => Promise<boolean>;

  /**
   * Optional badge configuration (e.g., "Latest", "Active")
   */
  badge?: LabelBadge | null;

  /**
   * Placeholder text for the input
   */
  placeholder?: string;

  /**
   * Placeholder when disabled
   */
  disabledPlaceholder?: string;

  /**
   * Title/tooltip when disabled
   */
  disabledTitle?: string;

  /**
   * Custom className for the table cell
   */
  className?: string;

  /**
   * Custom className for the input
   */
  inputClassName?: string;
}
