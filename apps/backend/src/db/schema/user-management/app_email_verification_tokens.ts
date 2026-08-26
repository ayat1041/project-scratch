import appUsersTable from "@/db/schema/user-management/app_users";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import "module-alias/register";

const appEmailVerificationTokensTable = pgTable(
  "app_email_verification_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsersTable.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    role: varchar({ length: 50 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Indexes for email verification performance
    userIdIdx: index("idx_email_verification_tokens_user_id").on(table.userId),
    expiresAtIdx: index("idx_email_verification_tokens_expires_at").on(
      table.expiresAt,
    ),
    // Composite index for user + role lookup (common in auth flows)
    userRoleIdx: index("idx_email_verification_tokens_user_role").on(
      table.userId,
      table.role,
    ),
  }),
);

export default appEmailVerificationTokensTable;
