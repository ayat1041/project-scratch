/**
 * Formats a date string or Date object as "Month YYYY" (e.g. "March 2023").
 * Returns an empty string if the input is falsy or unparseable.
 */
export const formatMonthYear = (value: string | Date | null | undefined): string => {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
