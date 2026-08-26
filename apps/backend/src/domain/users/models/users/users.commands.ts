import { db } from "@/db/db";
import { appUsersTable, appUserRolesTable } from "@/db/schema";
import { createError } from "@/middleware/error.middleware";
import { and, eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { generateUniqueUsername } from "@/utils/username-generator.utils";

export interface CreateUserInput {
  email: string;
  password: string;
  userName: string;
  profileImage?: string | null;
  providerName?: string | null;
}

export interface UpdateUserInput {
  userName?: string;
  profileImage?: string | null;
  isVerified?: boolean;
  isDeleted?: boolean;
}

/**
 * Create a new user
 * @param userData - User creation data
 * @returns Created user ID
 */
export const createUser = async (
  userData: CreateUserInput,
): Promise<typeof appUsersTable.$inferInsert> => {
  const hashedPassword = await hash(userData.password, 12);
  const generatedUserName = await generateUniqueUsername(userData.userName);

  const newUser = await db
    .insert(appUsersTable)
    .values({
      email: userData.email,
      password: hashedPassword,
      userName: generatedUserName,
      profileImage: userData.profileImage ?? undefined,
      providerName: userData.providerName ?? undefined,
      isVerified: false,
    })
    .returning();

  return newUser[0];
};

/**
 * Update user information
 * @param userId - User ID to update
 * @param updateData - Data to update
 * @returns Updated user ID
 */
export const updateUser = async (
  userId: string,
  updateData: UpdateUserInput,
): Promise<string> => {
  const updatedUser = await db
    .update(appUsersTable)
    .set(updateData)
    .where(eq(appUsersTable.id, userId))
    .returning({ id: appUsersTable.id });

  if (!updatedUser || updatedUser.length === 0) {
    throw createError.notFound("User not found for update");
  }

  return updatedUser[0].id;
};

/**
 * Verify user email
 * @param userId - User ID
 * @returns Success status
 */
export const verifyUser = async (userId: string): Promise<boolean> => {
  const result = await db
    .update(appUsersTable)
    .set({ isVerified: true })
    .where(eq(appUsersTable.id, userId))
    .returning({ id: appUsersTable.id });

  return result.length > 0;
};

/**
 * Soft delete a user
 * @param userId - User ID
 * @returns Success status
 */
export const softDeleteUser = async (userId: string): Promise<boolean> => {
  const result = await db
    .update(appUsersTable)
    .set({ isDeleted: true })
    .where(eq(appUsersTable.id, userId))
    .returning({ id: appUsersTable.id });

  return result.length > 0;
};

/**
 * Update user password
 * @param userId - User ID
 * @param newPassword - New password (plain text, will be hashed)
 * @returns Success status
 */
export const updateUserPassword = async (
  userId: string,
  newPassword: string,
): Promise<boolean> => {
  const hashedPassword = await hash(newPassword, 12);

  const result = await db
    .update(appUsersTable)
    .set({ password: hashedPassword })
    .where(eq(appUsersTable.id, userId))
    .returning({ id: appUsersTable.id });

  return result.length > 0;
};

/**
 * Assign role to user
 * @param userId - User ID
 * @param roleId - Role ID
 * @returns Success status
 */
export const assignRoleToUser = async (
  userId: string,
  roleId: number,
): Promise<boolean> => {
  await db.insert(appUserRolesTable).values({
    userId,
    roleId,
  });

  return true;
};

/**
 * Remove role from user
 * @param userId - User ID
 * @param roleId - Role ID
 * @returns Success status
 */
export const removeRoleFromUser = async (
  userId: string,
  roleId: number,
): Promise<boolean> => {
  await db
    .delete(appUserRolesTable)
    .where(
      and(
        eq(appUserRolesTable.userId, userId),
        eq(appUserRolesTable.roleId, roleId),
      ),
    );

  return true;
};
