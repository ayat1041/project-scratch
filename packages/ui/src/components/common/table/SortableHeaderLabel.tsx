'use client';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { SortDirection } from './TableHeaderRow.types';

// No text colour here — the button inherits it from the header cell, so a cell
// that overrides the default grey (e.g. `text-muted-foreground`) keeps its colour.
const SORT_BUTTON_CLASS =
  'w-full hover:text-foreground focus-visible:ring-ring flex items-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 rounded-sm';

/**
 * Builds the screen-reader label describing what activating the button will do
 */
function getSortButtonLabel(label: string, direction: SortDirection): string {
  if (direction === 'none') return `Sort by ${label}`;
  if (direction === 'asc')
    return `${label}, sorted ascending. Activate to sort descending`;
  return `${label}, sorted descending. Activate to remove sort`;
}

interface SortableHeaderLabelProps {
  label: string;
  /**
   * Sort direction for this column — 'none' when another column is active
   */
  direction: SortDirection;
  onSort: () => void;
}

/**
 * Sort toggle rendered inside a header cell.
 *
 * Owns the sort affordance only — the active column and direction are decided
 * by the parent TableHeaderRow, which passes 'none' to every inactive column.
 */
export default function SortableHeaderLabel({
  label,
  direction,
  onSort,
}: SortableHeaderLabelProps) {
  return (
    <button
      type="button"
      onClick={onSort}
      className={SORT_BUTTON_CLASS}
      aria-label={getSortButtonLabel(label, direction)}
    >
      {label}
      {direction === 'none' ? (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" aria-hidden="true" />
      ) : direction === 'asc' ? (
        <ArrowUp className="ml-1 h-3 w-3" aria-hidden="true" />
      ) : (
        <ArrowDown className="ml-1 h-3 w-3" aria-hidden="true" />
      )}
    </button>
  );
}
