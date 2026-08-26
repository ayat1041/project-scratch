import { db } from "@/db/db";
import { appUsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createError } from "@/middleware/error.middleware";

/**
 * Generate a unique username based on the full name
 * @param fullName - The user's full name
 * @returns Promise<string> - A unique username
 */
export async function generateUniqueUsername(
  fullName: string,
): Promise<string> {
  // Generate initial username from full name
  let finalUserName = fullName.toLowerCase().replace(/\s+/g, "-");
  let counter = 1;

  // Check if canonical username already exists and make it unique
  while (true) {
    const existingUser = await db
      .select({ userName: appUsersTable.userName })
      .from(appUsersTable)
      .where(eq(appUsersTable.userName, finalUserName))
      .limit(1);

    if (existingUser.length === 0) {
      break; // Username is available
    }

    // Username exists, try with counter
    finalUserName = `${fullName.toLowerCase().replace(/\s+/g, "-")}-${counter}`;
    counter++;

    // Safety check to prevent infinite loop
    if (counter > 9999) {
      throw createError.internal("Unable to generate unique username", {
        error: "Username generation failed",
        hint: "Please try again with a different name or contact support if the issue persists.",
      });
    }
  }

  return finalUserName;
}
