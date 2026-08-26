import { db } from "@/db/db";
import { appEmailVerificationTokensTable } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";

export type { EmailVerificationToken } from "@/domain/users/users.types";
import type { EmailVerificationToken } from "@/domain/users/users.types";

/**
 * Find email verification token by user, token, and role
 * @param userId - User's ID
 * @param token - Verification token
 * @param role - User's role
 * @returns Token record or null if not found
 */
export const findVerificationToken = async (
  userId: string,
  token: string,
  role: string,
): Promise<EmailVerificationToken | null> => {
  const tokenRecord = await db
    .select({
      id: appEmailVerificationTokensTable.id,
      token: appEmailVerificationTokensTable.token,
      expiresAt: appEmailVerificationTokensTable.expiresAt,
      role: appEmailVerificationTokensTable.role,
      userId: appEmailVerificationTokensTable.userId,
    })
    .from(appEmailVerificationTokensTable)
    .where(
      and(
        eq(appEmailVerificationTokensTable.userId, userId),
        eq(appEmailVerificationTokensTable.token, token),
        eq(appEmailVerificationTokensTable.role, role),
      ),
    )
    .limit(1);

  return tokenRecord.length > 0 ? tokenRecord[0] : null;
};

/**
 * Find valid (non-expired) verification token
 * @param userId - User's ID
 * @param token - Verification token
 * @param role - User's role
 * @returns Valid token record or null if not found/expired
 */
export const findValidVerificationToken = async (
  userId: string,
  token: string,
): Promise<EmailVerificationToken | null> => {
  const tokenRecord = await db
    .select({
      id: appEmailVerificationTokensTable.id,
      token: appEmailVerificationTokensTable.token,
      expiresAt: appEmailVerificationTokensTable.expiresAt,
      role: appEmailVerificationTokensTable.role,
      userId: appEmailVerificationTokensTable.userId,
    })
    .from(appEmailVerificationTokensTable)
    .where(
      and(
        eq(appEmailVerificationTokensTable.userId, userId),
        eq(appEmailVerificationTokensTable.token, token),
        gt(appEmailVerificationTokensTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return tokenRecord.length > 0 ? tokenRecord[0] : null;
};

/**
 * Check if verification token exists (lightweight check)
 * @param userId - User's ID
 * @param role - User's role
 * @returns Boolean indicating token existence
 */
export const hasVerificationToken = async (
  userId: string,
  role: string,
): Promise<boolean> => {
  const token = await db
    .select({ id: appEmailVerificationTokensTable.id })
    .from(appEmailVerificationTokensTable)
    .where(
      and(
        eq(appEmailVerificationTokensTable.userId, userId),
        eq(appEmailVerificationTokensTable.role, role),
      ),
    )
    .limit(1);

  return token.length > 0;
};
