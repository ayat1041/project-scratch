import { z } from "zod";

/**
 * UUID validation regex pattern
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Zod schema for validating UUID strings
 */
export const uuidSchema = z.string().regex(UUID_REGEX, "Invalid UUID format");

/**
 * Checks if a string is a valid UUID
 * @param id - The string to check
 * @returns Boolean indicating if the string is a valid UUID
 */
export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}
