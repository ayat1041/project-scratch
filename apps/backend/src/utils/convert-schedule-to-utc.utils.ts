// Type definitions
type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
type TimeOfDay = string; // Format: "HH:MM"
type DayOfMonth = string; // Format: "1" to "31"
type TimeZone = string; // Format: "America/New_York (UTC-04:00)"

interface ConversionResult {
  convertedTimeOfDay: TimeOfDay;
  convertedDayOfWeek: DayOfWeek;
  convertedDayOfMonth: DayOfMonth;
}

/**
 * Converts newsletter scheduling parameters from local timezone to UTC
 * @param timeOfDay - Time in HH:MM format (e.g., "14:30")
 * @param dayOfWeek - Single day name (e.g., "monday")
 * @param dayOfMonth - Single day number as string (e.g., "15")
 * @param timeZone - Timezone string (e.g., "America/New_York (UTC-04:00)")
 * @returns Object with convertedTimeOfDay, convertedDayOfWeek, convertedDayOfMonth
 */
export function convertScheduleToUTC(
  timeOfDay: TimeOfDay,
  dayOfWeek: string,
  dayOfMonth: string,
  timeZone: TimeZone,
): ConversionResult {
  // Extract timezone identifier from the format "America/New_York (UTC-04:00)"
  // const timezoneId: string = timeZone.split(' ')[0];

  // Parse the time
  const [hours, minutes] = timeOfDay.split(":").map(Number);

  // Validate time format
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(
      `Invalid time format: ${timeOfDay}. Expected format: HH:MM`,
    );
  }

  // Day name mappings
  const dayNames: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayNameToIndex: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  // Validate day of week
  const normalizedDayOfWeek = dayOfWeek.toLowerCase();
  if (
    !Object.prototype.hasOwnProperty.call(dayNameToIndex, normalizedDayOfWeek)
  ) {
    throw new Error(`Invalid day of week: ${dayOfWeek}`);
  }

  // Validate day of month
  const dayNum = parseInt(dayOfMonth);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
    throw new Error(
      `Invalid day of month: ${dayOfMonth}. Must be between 1 and 31`,
    );
  }

  // Extract UTC offset from timezone string (e.g., "UTC-04:00" -> -4)
  const utcOffsetMatch = timeZone.match(/UTC([+-])(\d{2}):(\d{2})/);
  if (!utcOffsetMatch) {
    throw new Error(
      `Invalid timezone format: ${timeZone}. Expected format: "America/New_York (UTC-04:00)"`,
    );
  }

  const sign = utcOffsetMatch[1] === "+" ? 1 : -1;
  const offsetHours = parseInt(utcOffsetMatch[2]);
  const offsetMinutes = parseInt(utcOffsetMatch[3]);
  const totalOffsetHours = sign * (offsetHours + offsetMinutes / 60);

  // Convert local time to UTC by subtracting the offset
  const localTotalMinutes = hours * 60 + minutes;
  const utcTotalMinutes = localTotalMinutes - totalOffsetHours * 60;

  // Handle day rollover
  let dayShift = 0;
  let finalUtcMinutes = utcTotalMinutes;

  if (utcTotalMinutes < 0) {
    // Previous day
    finalUtcMinutes = 24 * 60 + utcTotalMinutes;
    dayShift = -1;
  } else if (utcTotalMinutes >= 24 * 60) {
    // Next day
    finalUtcMinutes = utcTotalMinutes - 24 * 60;
    dayShift = 1;
  }

  const utcHours = Math.floor(finalUtcMinutes / 60);
  const utcMinutes = finalUtcMinutes % 60;

  // Format UTC time
  const convertedTimeOfDay: TimeOfDay = `${utcHours.toString().padStart(2, "0")}:${utcMinutes.toString().padStart(2, "0")}`;

  // Convert day of week accounting for day shifts
  const dayIndex = dayNameToIndex[normalizedDayOfWeek];
  const newDayIndex = (dayIndex + dayShift + 7) % 7;
  const convertedDayOfWeek: DayOfWeek = dayNames[newDayIndex];

  // Convert day of month accounting for day shifts
  let newDay = dayNum + dayShift;

  // Handle month boundaries (simplified - assumes 30-day months)
  if (newDay < 1) {
    newDay = 30 + newDay; // Previous month
  } else if (newDay > 31) {
    newDay = newDay - 31; // Next month
  }

  const convertedDayOfMonth: DayOfMonth = newDay.toString();

  return {
    convertedTimeOfDay,
    convertedDayOfWeek,
    convertedDayOfMonth,
  };
}
