import { createGoogleAuth, FRONTEND_URL } from "@/constants/variables";
import { createError } from "@/middleware/error.middleware";
import { Request, Response } from "express";
import { GoogleUser } from "../types/auth-commands.types";
import { db } from "@/db/db";
import { eq, sql } from "drizzle-orm";
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

export const googleSignIn = asyncHandler(
  async (req: Request, res: Response) => {
    const { codeVerifier, savedState, googleAuthToken } = req.cookies;

    const fullUrl = `${req.protocol}://${req.get("host")}${req.url}`;
    const url = new URL(fullUrl);

    const searchParams = url.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthParams = getOAuthCallbackParams({
      providerName: "Google",
      code,
      state,
    });

    if (typeof codeVerifier !== "string" || codeVerifier.length === 0) {
      throw createError.validation("Missing Google OAuth code verifier.", {
        error: "codeVerifier is missing in the request",
        hint: "Please restart the sign-in flow.",
      });
    }

    assertOAuthState({
      providerName: "Google",
      savedState,
      receivedState: oauthParams.state,
    });
    clearOAuthCookies(res, ["savedState", "codeVerifier"]);

    // Exchange code for tokens
    const google = await createGoogleAuth();
    const tokens = await google.validateAuthorizationCode(
      oauthParams.code,
      codeVerifier,
    );

    const googleAccessToken = tokens.accessToken();

    // Fetch user info from Google
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
        method: "GET",
      },
    );

    if (!googleRes.ok) {
      throw createError.internal("Failed to fetch user info from Google", {
        status: googleRes.status,
        error: await googleRes.text(),
      });
    }

    const googleData = (await googleRes.json()) as GoogleUser & {
      timezone?: string;
      locale?: string;
    };
    const googleEmail = assertVerifiedOAuthEmail(
      "Google",
      googleData.email,
      googleData.verified_email,
    );

    if (googleAuthToken) {
      clearOAuthCookies(res, ["googleAuthToken"]);

      const decryptedData = await decryptToken(googleAuthToken);
      assertOAuthEmailMatchesToken({
        providerName: "Google",
        tokenEmail: decryptedData.email,
        providerEmail: googleEmail,
      });
    }

    // Use transaction to ensure data consistency
    const userDetails = await db.transaction(async (tx) => {
      // Check if user exists
      const existingUser = await tx
        .select()
        .from(appUsersTable)
        .where(eq(appUsersTable.email, googleEmail));

      let userId: string;
      let isNewUser = false;

      if (existingUser.length === 0) {
        isNewUser = true;

        // Create new user
        const [newUser] = await tx
          .insert(appUsersTable)
          .values({
            email: googleEmail,
            password: "", // Google users don't need a password
            userName: googleEmail.split("@")[0], // Add userName field
            isDeleted: false,
            isVerified: true, // Google users are considered verified
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
          .where(eq(appUsersTable.email, googleEmail));
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
          to: googleEmail,
          subject: "🎉 Welcome to Starter- Let's Get Started!",
          html: onRegisterWelcomeEmail({
            email: googleEmail,
            name: googleData.name || googleEmail.split("@")[0],
          }),
        };
        await eventPublisher.publish(
          ROUTING_KEYS.NOTIFICATION_EMAIL_SEND,
          emailData,
        );
      } catch (error) {
        logger.error("Failed to publish Google welcome email", { error });
      }
    }

    // Create session using the new single-token approach
    // This handles:
    // 1. Generating session token with jti and familyId
    // 2. Storing session in database with device info
    // 3. Setting session cookie (HttpOnly)
    // 4. Setting CSRF cookie (readable by JS)
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
