import { db } from "@/db/db";
import { appLanguagesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createError } from "@/middleware/error.middleware";

export const deleteLanguageService = async (id: string) => {
  // Check if the language exists
  const existingLanguage = await db
    .select()
    .from(appLanguagesTable)
    .where(eq(appLanguagesTable.id, id))
    .limit(1)
    .execute();

  if (existingLanguage.length === 0) {
    throw createError.notFound("Language not found", {
      error: "The specified language does not exist",
      hint: "Please provide a valid language ID.",
    });
  }

  // Delete the language
  await db
    .delete(appLanguagesTable)
    .where(eq(appLanguagesTable.id, id))
    .execute();
};
