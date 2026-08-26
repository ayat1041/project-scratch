import "module-alias/register";
import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const appUsersTable = pgTable("app_users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 64 }).notNull(),
  isVerified: boolean().notNull().default(false),
  isDeleted: boolean().notNull().default(false),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Fields moved from profile table
  providerName: varchar("provider_name", { length: 90 })
    .notNull()
    .default("email"),

  userOrigin: varchar("user_origin", { length: 50 })
    .notNull()
    .default("self_registered"), // self_registered, admin_created — see USER_ORIGIN_TYPES in @repo/constants
  invitedBy: uuid("invited_by"),
  userName: varchar("username", { length: 150 }).notNull().unique(),
  userNameUpdatedAt: timestamp("username_updated_at"),
  profileImage: varchar("profile_image", { length: 500 }),
});
export default appUsersTable;
