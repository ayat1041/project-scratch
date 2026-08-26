import { db } from "@/db/db";
import { appEmailVerificationTokensTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CreateVerificationTokenInput } from "./email-verification.commands";

/**
 * Replace existing verification token with new one (atomic operation)
 * @param tokenData - New token data
 * @returns New token ID
 */
export const replaceVerificationToken = async (
  tokenData: CreateVerificationTokenInput,
): Promise<string> => {
  return await db.transaction(async (tx) => {
    // Delete existing token for this user and role
    await tx
      .delete(appEmailVerificationTokensTable)
      .where(
        and(
          eq(appEmailVerificationTokensTable.userId, tokenData.userId),
          eq(appEmailVerificationTokensTable.role, tokenData.role),
        ),
      );

    // Create new token
    const newToken = await tx
      .insert(appEmailVerificationTokensTable)
      .values(tokenData)
      .returning({ id: appEmailVerificationTokensTable.id });

    return newToken[0].id;
  });
};

/**
 * Delete verification token by ID (atomic operation)
 * @param tokenId - Token ID to delete
 * @returns Success status
 */
export const consumeVerificationToken = async (
  tokenId: string,
): Promise<void> => {
  await db
    .delete(appEmailVerificationTokensTable)
    .where(eq(appEmailVerificationTokensTable.id, tokenId));
};
