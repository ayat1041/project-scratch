import { db } from "@/db/db";
import { appEmailVerificationTokensTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface CreateVerificationTokenInput {
  userId: string;
  token: string;
  role: string;
  expiresAt: Date;
}

/**
 * Delete verification token by user ID
 * @param userId - User's ID
 * @returns Success status
 */
export const deleteVerificationTokenByUserId = async (
  userId: string,
): Promise<void> => {
  await db
    .delete(appEmailVerificationTokensTable)
    .where(eq(appEmailVerificationTokensTable.userId, userId));
};

/**
 * Delete specific verification token by token ID
 * @param tokenId - Token ID
 * @returns Success status
 */
export const deleteVerificationTokenById = async (
  tokenId: string,
): Promise<void> => {
  await db
    .delete(appEmailVerificationTokensTable)
    .where(eq(appEmailVerificationTokensTable.id, tokenId));
};

/**
 * Delete verification token by user ID and role
 * @param userId - User's ID
 * @param role - User's role
 * @returns Success status
 */
export const deleteVerificationTokenByUserAndRole = async (
  userId: string,
  role: string,
): Promise<void> => {
  await db
    .delete(appEmailVerificationTokensTable)
    .where(
      and(
        eq(appEmailVerificationTokensTable.userId, userId),
        eq(appEmailVerificationTokensTable.role, role),
      ),
    );
};

/**
 * Create new verification token
 * @param tokenData - Token creation data
 * @returns Created token ID
 */
export const createVerificationToken = async (
  tokenData: CreateVerificationTokenInput,
): Promise<string> => {
  const newToken = await db
    .insert(appEmailVerificationTokensTable)
    .values({
      userId: tokenData.userId,
      token: tokenData.token,
      role: tokenData.role,
      expiresAt: tokenData.expiresAt,
    })
    .returning({ id: appEmailVerificationTokensTable.id });

  return newToken[0].id;
};

/**
 * Update verification token expiration
 * @param tokenId - Token ID
 * @param newExpiresAt - New expiration date
 * @returns Success status
 */
export const updateTokenExpiration = async (
  tokenId: string,
  newExpiresAt: Date,
): Promise<void> => {
  await db
    .update(appEmailVerificationTokensTable)
    .set({ expiresAt: newExpiresAt })
    .where(eq(appEmailVerificationTokensTable.id, tokenId));
};
