import { db } from "@/db/db";
import { appLanguagesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createError } from "@/middleware/error.middleware";

export const createLanguageService = async (languageNames: string) => {
  // Support adding multiple languages separated by commas
  const names = languageNames
    .split(",")
    .map((n: string) => n.trim())
    .filter((n: string) => n.length > 0);

  if (names.length === 0) {
    throw createError.badRequest("No valid language names provided", {
      error: "No language names found after parsing",
      hint: "Please provide at least one valid language name.",
    });
  }

  // Check for duplicates in the input
  const uniqueNames = Array.from(
    new Set(names.map((n: string) => n.toLowerCase())),
  );
  if (uniqueNames.length !== names.length) {
    throw createError.badRequest("Duplicate language names in request", {
      error: "Duplicate names detected",
      hint: "Please provide unique language names.",
    });
  }

  // Check if any of the languages already exist
  const existingLanguages = await db
    .select()
    .from(appLanguagesTable)
    .where(eq(appLanguagesTable.name, names[0]));

  if (existingLanguages.length > 0) {
    throw createError.conflict("Some languages already exist", {
      error: "Duplicate language(s)",
      existing: existingLanguages.map((l) => l.name),
      hint: "Remove existing languages from your request.",
    });
  }

  // Insert new languages
  await db
    .insert(appLanguagesTable)
    .values(names.map((n: string) => ({ name: n })));

  return {
    success: true,
    message: "Languages created successfully",
  };
};
