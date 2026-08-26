export interface SliceWithOverflowResult<T> {
  /** Full list, sorted primary-first when `isPrimary` is given. */
  all: T[];
  /** First `visibleCount` items of `all`. */
  visible: T[];
  /** How many items beyond `visible` exist (never negative). */
  remainingCount: number;
}

/**
 * Sort-by-primary (optional) + slice(0, n) + remainder-count — the pure data
 * logic behind any "show first N, +N more" overflow affordance.
 */
export function sliceWithOverflow<T>(
  items: T[],
  visibleCount: number,
  options?: { isPrimary?: (item: T) => boolean }
): SliceWithOverflowResult<T> {
  const all = options?.isPrimary
    ? [...items].sort((a, b) => {
        const aPrimary = options.isPrimary!(a);
        const bPrimary = options.isPrimary!(b);
        if (aPrimary === bPrimary) return 0;
        return aPrimary ? -1 : 1;
      })
    : items;

  return {
    all,
    visible: all.slice(0, visibleCount),
    remainingCount: Math.max(0, all.length - visibleCount),
  };
}
