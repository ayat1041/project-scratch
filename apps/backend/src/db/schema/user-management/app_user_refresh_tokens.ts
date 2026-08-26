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

const appUserRefreshTokensTable = pgTable(
  "app_user_refresh_tokens",
  {
    jti: uuid().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsersTable.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").notNull(),
    rotatedTo: uuid("rotated_to"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at").notNull(),
    deviceInfo: text().notNull(),
    ip: varchar({ length: 50 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Indexes for session management performance
    userIdIdx: index("idx_user_refresh_tokens_user_id").on(table.userId),
    familyIdIdx: index("idx_user_refresh_tokens_family_id").on(table.familyId),
    expiresAtIdx: index("idx_user_refresh_tokens_expires_at").on(
      table.expiresAt,
    ),
    // Composite index for cleanup and validation
    userExpiresIdx: index("idx_user_refresh_tokens_user_expires").on(
      table.userId,
      table.expiresAt,
    ),
  }),
);
export default appUserRefreshTokensTable;

// to do : add indexes on token, userId, expiresAt
