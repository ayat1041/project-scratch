import { db } from "@/db/db";
import { appUsersTable, appUserRolesTable } from "@/db/schema";
import { createError } from "@/middleware/error.middleware";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { generateUniqueUsername } from "@/utils/username-generator.utils";
import { checkUserExistsByEmail } from "@/domain/users/models/users/users.queries";

/**
 * Gets or creates a user for signup process
 * - Throws error if verified user exists with email
 * - Returns existing userId if unverified user exists
 * - Creates new user if no user exists with email
 * @param email - Email address
 * @param password - User password
 * @param userName - User name
 * @param roleId - Valid role ID
 * @returns userId (existing unverified or newly created)
 */
export const getOrCreateUserOnSignUp = async (
  email: string,
  password: string,
  userName: string,
  roleId: number,
): Promise<typeof appUsersTable.$inferInsert> => {
  const existingUser = await checkUserExistsByEmail(email);

  if (existingUser) {
    // If user is verified, throw error
    if (existingUser.isVerified) {
      throw createError.conflict(
        "This email is already in use. Want to log in?",
        {
          error: "A verified user with this email already exists",
        },
      );
    }

    // If user is not verified, update their info and return their ID
    if (!existingUser.isVerified) {
      const hashedPassword = await hash(password, 12);
      const generatedUserName = await generateUniqueUsername(userName);

      await db.transaction(async (tx) => {
        // Update user info
        await tx
          .update(appUsersTable)
          .set({
            userName: generatedUserName,
            password: hashedPassword,
          })
          .where(eq(appUsersTable.id, existingUser.id));

        // Remove existing roles
        await tx
          .delete(appUserRolesTable)
          .where(eq(appUserRolesTable.userId, existingUser.id));

        // Assign new role
        await tx.insert(appUserRolesTable).values({
          userId: existingUser.id,
          roleId,
        });
      });

      return existingUser;
    }
  }

  // No existing user - create new user with role
  const hashedPassword = await hash(password, 12);
  const generatedUserName = await generateUniqueUsername(userName);

  return await db.transaction(async (tx) => {
    // Create user
    const [userInfo] = await tx
      .insert(appUsersTable)
      .values({
        email,
        password: hashedPassword,
        userName: generatedUserName,
        isVerified: false,
      })
      .returning();

    // Assign role to user
    await tx.insert(appUserRolesTable).values({
      userId: userInfo.id!,
      roleId,
    });

    return userInfo;
  });
};
