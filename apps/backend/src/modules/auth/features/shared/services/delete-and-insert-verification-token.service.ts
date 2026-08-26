import { db } from "@/db/db";
import { appEmailVerificationTokensTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Manage email verification token - delete old and create new
 * @param userId - User ID
 * @param token - Verification token
 * @param role - User role
 * @param expiresAt - Token expiration date
 * @returns Success status
 */
export const deleteAndInsertEmailVerificationToken = async ({
  userId,
  token,
  role,
  expiresAt,
}: {
  userId: string;
  token: string;
  role?: string;
  expiresAt: Date;
}): Promise<void> => {
  await db.transaction(async (tx) => {
    // Check if token already exists for this user and role
    const existingToken = await tx
      .select()
      .from(appEmailVerificationTokensTable)
      .where(
        role
          ? and(
              eq(appEmailVerificationTokensTable.userId, userId),
              eq(appEmailVerificationTokensTable.role, role),
            )
          : eq(appEmailVerificationTokensTable.userId, userId),
      );

    // Only delete if token exists
    if (existingToken.length > 0) {
      await tx
        .delete(appEmailVerificationTokensTable)
        .where(
          role
            ? and(
                eq(appEmailVerificationTokensTable.userId, userId),
                eq(appEmailVerificationTokensTable.role, role),
              )
            : eq(appEmailVerificationTokensTable.userId, userId),
        );
    }

    // Insert new verification token
    await tx.insert(appEmailVerificationTokensTable).values({
      userId,
      token,
      role,
      expiresAt,
    });
  });
};
