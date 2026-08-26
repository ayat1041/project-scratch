import {
  appUsersTable,
  appUserRolesTable,
  appRolesTable,
  appEmailVerificationTokensTable,
} from "@/db/schema";
import type { AppEmailVerificationTokens } from "@repo/schemas-types/tables/entity-types";

// Table row types
export type UserRow = typeof appUsersTable.$inferSelect;
export type UserRoleRow = typeof appUserRolesTable.$inferSelect;
export type RoleRow = typeof appRolesTable.$inferSelect;
export type EmailVerificationTokenRow =
  typeof appEmailVerificationTokensTable.$inferSelect;

// Query result types (join/select shapes returned by domain query functions)

export type EmailVerificationToken = {
  id: string;
  token: AppEmailVerificationTokens["token"];
  expiresAt: AppEmailVerificationTokens["expiresAt"];
  role: Exclude<AppEmailVerificationTokens["role"], undefined> | null;
  userId: string;
};
