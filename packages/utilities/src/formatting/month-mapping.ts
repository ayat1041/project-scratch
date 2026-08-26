const MONTH_NAMES_LONG = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

const MONTH_NAMES_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const;

export const MONTH_OPTIONS = MONTH_NAMES_LONG.map((label, index) => ({
    value: index + 1,
    label,
}));

export const coerceMonthToNumber = (
    month: number | string | null | undefined,
): number | null => {
    if (month === null || month === undefined || month === "") return null;

    if (typeof month === "number") {
        return month >= 1 && month <= 12 ? month : null;
    }

    const trimmed = month.trim();
    if (!trimmed) return null;

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 12) {
        return numeric;
    }

    const lowered = trimmed.toLowerCase();
    const longIndex = MONTH_NAMES_LONG.findIndex(
        (name) => name.toLowerCase() === lowered,
    );
    if (longIndex >= 0) return longIndex + 1;

    const shortIndex = MONTH_NAMES_SHORT.findIndex(
        (name) => name.toLowerCase() === lowered,
    );
    if (shortIndex >= 0) return shortIndex + 1;

    return null;
};

export const getMonthLabel = (
    month: number | string | null | undefined,
    format: "long" | "short" = "long",
): string => {
    const monthNumber = coerceMonthToNumber(month);
    if (!monthNumber) return "";

    const names = format === "short" ? MONTH_NAMES_SHORT : MONTH_NAMES_LONG;
    return names[monthNumber - 1] ?? "";
};
