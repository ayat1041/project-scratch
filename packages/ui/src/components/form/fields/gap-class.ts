/**
 * Static lookup for gap utility classes. Tailwind's JIT scanner only picks up
 * class names that appear as literal strings in source — a template literal
 * like `gap-${gap}` is invisible to it and silently renders with no gap at all.
 */
export const GAP_CLASS = {
  "2": "gap-2",
  "4": "gap-4",
  "6": "gap-6",
  "8": "gap-8",
} as const;

export type GapValue = keyof typeof GAP_CLASS;
