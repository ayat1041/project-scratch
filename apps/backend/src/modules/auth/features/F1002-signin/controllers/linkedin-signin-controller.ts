import { createLinkedInAuth, FRONTEND_URL } from "@/constants/variables";
import { createError } from "@/middleware/error.middleware";
import { Request, Response } from "express";
import { db } from "@/db/db";
import { eq, sql } from "drizzle-orm";
import axios from "axios";
import {
  appRolesTable,
  appUsersTable,
  appPermissionsTable,
  appPermissionToRolesTable,
  appUserRolesTable,
} from "@/db/schema";
import { eventPublisher } from "@/infrastructure/events/event-publisher";
import { ROUTING_KEYS } from "@/constants/routing-keys";
import { EmailJob } from "@/infrastructure/events/email-job.types";
import { logger } from "@/infrastructure/monitoring/logger";
import { onRegisterWelcomeEmail } from "@/data/emails/auth-email-contents.template";
import { createSession } from "@/lib/session-auth.utils";
import { decryptToken } from "@/lib/auth.utils";
import { asyncHandler } from "@/utils/async-handler";
import {
  assertOAuthEmailMatchesToken,
  assertOAuthState,
  assertVerifiedOAuthEmail,
  clearOAuthCookies,
  getOAuthCallbackParams,
  getSafeOAuthRedirectPath,
} from "@/modules/auth/oauth-callback.utils";

interface LinkedInUser {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email: string;
  email_verified: boolean;
  picture?: string;
  locale?: string;
}

export const linkedinSignIn = asyncHandler(
  async (req: Request, res: Response) => {
    const { savedState, linkedinAuthToken } = req.cookies;

    const fullUrl = `${req.protocol}://${req.get("host")}${req.url}`;
    const url = new URL(fullUrl);

    const searchParams = url.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthParams = getOAuthCallbackParams({
      providerName: "LinkedIn",
      code,
      state,
    });

    assertOAuthState({
      providerName: "LinkedIn",
      savedState,
      receivedState: oauthParams.state,
    });
    clearOAuthCookies(res, ["savedState"]);

    // Exchange code for tokens
    const linkedin = await createLinkedInAuth();
    const tokens = await linkedin.validateAuthorizationCode(oauthParams.code);

    const linkedinAccessToken = tokens.accessToken();

    // Fetch user info from LinkedIn using OpenID Connect
    let linkedinData: LinkedInUser;

    try {
      const linkedinRes = await axios.get<LinkedInUser>(
        "https://api.linkedin.com/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${linkedinAccessToken}`,
          },
          timeout: 15000, // 15 second timeout
          family: 4, // Force IPv4
          httpAgent: new (await import("http")).Agent({
            keepAlive: true,
            family: 4,
          }),
          httpsAgent: new (await import("https")).Agent({
            keepAlive: true,
            family: 4,
            rejectUnauthorized: true,
          }),
        },
      );

      linkedinData = linkedinRes.data;
    } catch (fetchError: unknown) {
      if (axios.isAxiosError(fetchError)) {
        if (fetchError.code === "ECONNABORTED") {
          throw createError.timeout("LinkedIn API request timed out", {
            error: "The request to LinkedIn took too long",
          });
        }

        if (fetchError.response) {
          throw createError.internal(
            "Failed to fetch user info from LinkedIn",
            {
              status: fetchError.response.status,
              error: fetchError.response.data,
            },
          );
        }
      }

      throw fetchError;
    }

    const linkedinEmail = assertVerifiedOAuthEmail(
      "LinkedIn",
      linkedinData.email,
      linkedinData.email_verified,
    );

    if (linkedinAuthToken) {
      clearOAuthCookies(res, ["linkedinAuthToken"]);

      const decryptedData = await decryptToken(linkedinAuthToken);
      assertOAuthEmailMatchesToken({
        providerName: "LinkedIn",
        tokenEmail: decryptedData.email,
        providerEmail: linkedinEmail,
      });
    }

    // Use transaction to ensure data consistency
    const userDetails = await db.transaction(async (tx) => {
      // Check if user exists
      const existingUser = await tx
        .select()
        .from(appUsersTable)
        .where(eq(appUsersTable.email, linkedinEmail));

      let userId: string;
      let isNewUser = false;

      if (existingUser.length === 0) {
        isNewUser = true;

        // Create new user
        const [newUser] = await tx
          .insert(appUsersTable)
          .values({
            email: linkedinEmail,
            password: "", // LinkedIn users don't need a password
            userName: linkedinEmail.split("@")[0],
            isDeleted: false,
            isVerified: true, // LinkedIn users are considered verified
            registeredAt: new Date(),
          })
          .returning();
        userId = newUser.id;
      } else {
        // Update existing user
        await tx
          .update(appUsersTable)
          .set({
            isVerified: true,
          })
          .where(eq(appUsersTable.email, linkedinEmail));
        userId = existingUser[0].id;
      }

      // Fetch updated user data along with profile
      const [updatedUser] = await tx
        .select({
          id: appUsersTable.id,
          email: appUsersTable.email,
          roleName: appRolesTable.name,
          isVerified: appUsersTable.isVerified,
          isDeleted: appUsersTable.isDeleted,
          registeredAt: appUsersTable.registeredAt,
          permissions: sql<string>`STRING_AGG(${appPermissionsTable.name}, ',')`,
        })
        .from(appUsersTable)
        .where(eq(appUsersTable.id, userId))
        .leftJoin(
          appUserRolesTable,
          eq(appUsersTable.id, appUserRolesTable.userId),
        )
        .leftJoin(appRolesTable, eq(appUserRolesTable.roleId, appRolesTable.id))
        .leftJoin(
          appPermissionToRolesTable,
          eq(appRolesTable.id, appPermissionToRolesTable.roleId),
        )
        .leftJoin(
          appPermissionsTable,
          eq(appPermissionToRolesTable.permissionId, appPermissionsTable.id),
        )
        .groupBy(appUsersTable.id, appRolesTable.id);

      // Format permissions
      const permissionsArray =
        updatedUser.permissions?.split(",").filter((p) => p) || [];

      const userDetails = {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.roleName,
        permissions: permissionsArray,
        isVerified: updatedUser.isVerified,
        isDeleted: updatedUser.isDeleted,
        registeredAt: updatedUser.registeredAt,
        isNewUser,
      };

      return userDetails;
    });

    if (userDetails.isNewUser) {
      try {
        const emailData: EmailJob = {
          from: process.env.EMAIL_USER || "noreply@example.com",
          to: linkedinEmail,
          subject: "🎉 Welcome to Starter- Let's Get Started!",
          html: onRegisterWelcomeEmail({
            email: linkedinEmail,
            name: linkedinData.name || linkedinEmail.split("@")[0],
          }),
        };
        await eventPublisher.publish(
          ROUTING_KEYS.NOTIFICATION_EMAIL_SEND,
          emailData,
        );
      } catch (error) {
        logger.error("Failed to publish LinkedIn welcome email", { error });
      }
    }

    // Create session using the new single-token approach
    await createSession(res, userDetails.id, userDetails.email, req);

    // Validate redirectTo to prevent open-redirect attacks.
    // Must be a string, must start with '/', must NOT start with '//' (protocol-relative).
    const redirectPath = getSafeOAuthRedirectPath(req);

    // Check if the user is new and redirect accordingly
    const redirectUrl = userDetails.isNewUser
      ? FRONTEND_URL
      : `${FRONTEND_URL}${redirectPath}`;

    // Redirect the user to the frontend application
    res.redirect(redirectUrl);
  },
);
